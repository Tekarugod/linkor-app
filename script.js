// ===== NEUROSPACE v2.1 FINAL =====
let state = {
  users: {},
  currentUser: null,
  spaces: [],
  currentSpaceId: null,
  nodes: {},
  edges: {},
  theme: 'cyber',
  accentColor: '#00f5ff',
  tool: 'select',
  selectedNodeId: null,
  connectSource: null,
  view: { x: 0, y: 0, scale: 1 },
  dragging: null,
  panning: false,
  panStart: null,
  nodeIdCounter: 1,
  edgeIdCounter: 1,
  spaceIdCounter: 1,
};

const NODE_COLORS = [
  { bg: '#0d2040', dot: '#00f5ff', label: 'Синий' },
  { bg: '#1a0a2e', dot: '#7b2fff', label: 'Фиолетовый' },
  { bg: '#200a14', dot: '#ff006e', label: 'Розовый' },
  { bg: '#0a1f14', dot: '#00ff88', label: 'Зелёный' },
  { bg: '#1f130a', dot: '#ff9500', label: 'Оранжевый' },
  { bg: '#1f1a0a', dot: '#ffe600', label: 'Жёлтый' },
];

const EMOJIS = ['🧠','⚡','🌐','🔮','💡','🚀','🔬','🎯','🌊','🔥','💎','🌌','📊','🎨'];
const COLORS = ['#00f5ff','#ff006e','#7b2fff','#00ff88','#ff9500','#ff3366','#00bfff','#ff6b00','#ffe600'];
let newSpaceEmoji = '🧠';
let newSpaceColor = '#00f5ff';

// ===== PERSISTENCE =====
function loadState() {
  try {
    const raw = localStorage.getItem('neurospace_v2');
    if (raw) {
      const saved = JSON.parse(raw);
      state.users = saved.users || {};
      state.currentUser = saved.currentUser || null;
      state.spaces = saved.spaces || [];
      state.nodes = saved.nodes || {};
      state.edges = saved.edges || {};
      state.theme = saved.theme || 'cyber';
      state.accentColor = saved.accentColor || '#00f5ff';
      state.nodeIdCounter = saved.nodeIdCounter || 1;
      state.edgeIdCounter = saved.edgeIdCounter || 1;
      state.spaceIdCounter = saved.spaceIdCounter || 1;
    }
  } catch(e) { console.error('Load error:', e); }
}

function saveState() {
  try {
    localStorage.setItem('neurospace_v2', JSON.stringify({
      users: state.users,
      currentUser: state.currentUser,
      spaces: state.spaces,
      nodes: state.nodes,
      edges: state.edges,
      theme: state.theme,
      accentColor: state.accentColor,
      nodeIdCounter: state.nodeIdCounter,
      edgeIdCounter: state.edgeIdCounter,
      spaceIdCounter: state.spaceIdCounter,
    }));
  } catch(e) { console.error('Save error:', e); }
}

// ===== NAVIGATION =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  if (id === 'hub') renderHub();
  if (id === 'engine') renderEngine();
  if (id === 'settings') {
    setSettingsTab('appearance');
    renderSettings('appearance');
  }
}

// ===== AUTH =====
function switchTab(tab) {
  document.querySelectorAll('.gate-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('login-form').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('login-error').textContent = '';
  document.getElementById('reg-error').textContent = '';
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  if (!email || !pass) { errEl.textContent = '⚠ Введите идентификатор и код доступа'; return; }
  const user = state.users[email];
  if (!user || user.pass !== pass) { errEl.textContent = '⚠ Неверный идентификатор или код доступа'; return; }
  state.currentUser = email;
  saveState();
  showPage('hub');
  showToast('✓ С возвращением, ' + user.nick);
}

function doRegister() {
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim() || (nick + '@neurospace.io');
  const pass = document.getElementById('reg-pass').value;
  const errEl = document.getElementById('reg-error');
  if (!nick || !pass) { errEl.textContent = '⚠ Заполните все поля'; return; }
  if (state.users[email]) { errEl.textContent = '⚠ Пользователь с таким email уже существует'; return; }
  state.users[email] = { nick, pass, createdAt: Date.now() };
  state.currentUser = email;
  if (state.spaces.length === 0) {
    createDemoData();
  }
  saveState();
  showPage('hub');
  showToast('⚡ Аккаунт создан! Добро пожаловать, ' + nick);
}

function doLogout() {
  state.currentUser = null;
  state.selectedNodeId = null;
  state.connectSource = null;
  saveState();
  showPage('gate');
}

function createDemoData() {
  const spaceId = 'sp_demo1';
  state.spaces.push({ id: spaceId, name: 'Мой первый проект', icon: '🧠', color: '#00f5ff' });
  state.nodes['n_d1'] = { id: 'n_d1', spaceId, x: 100, y: 100, title: 'Главная идея', desc: 'Центральная концепция проекта', tags: 'проект, идея', colorIdx: 0 };
  state.nodes['n_d2'] = { id: 'n_d2', spaceId, x: 350, y: 50, title: 'Направление A', desc: 'Первое направление развития', tags: 'развитие', colorIdx: 2 };
  state.nodes['n_d3'] = { id: 'n_d3', spaceId, x: 350, y: 200, title: 'Направление B', desc: 'Второе направление развития', tags: 'развитие', colorIdx: 1 };
  state.nodes['n_d4'] = { id: 'n_d4', spaceId, x: 600, y: 120, title: 'Конкретный шаг', desc: 'Что нужно сделать в первую очередь', tags: 'задача, срочно', colorIdx: 3 };
  state.edges['e_d1'] = { id: 'e_d1', spaceId, from: 'n_d1', to: 'n_d2' };
  state.edges['e_d2'] = { id: 'e_d2', spaceId, from: 'n_d1', to: 'n_d3' };
  state.edges['e_d3'] = { id: 'e_d3', spaceId, from: 'n_d2', to: 'n_d4' };
  state.nodeIdCounter = 100;
  state.edgeIdCounter = 100;
  state.spaceIdCounter = 10;
}

// ===== HUB =====
function renderHub() {
  if (!state.currentUser) return;
  const user = state.users[state.currentUser];
  document.getElementById('hub-username').textContent = user.nick;
  document.getElementById('hub-avatar').textContent = user.nick.substring(0, 2).toUpperCase();
  applyAccentColor();
  if (state.theme) applyTheme(state.theme);
  const grid = document.getElementById('spaces-grid');
  grid.innerHTML = '';
  state.spaces.forEach(space => {
    const nodeCount = Object.values(state.nodes).filter(n => n.spaceId === space.id).length;
    const edgeCount = Object.values(state.edges).filter(e => e.spaceId === space.id).length;
    const card = document.createElement('div');
    card.className = 'space-card';
    card.style.animationDelay = (state.spaces.indexOf(space) * 0.05) + 's';
    card.innerHTML = `
      <div class="space-card-accent" style="background:linear-gradient(90deg,${space.color || 'var(--accent)'},transparent)"></div>
      <div class="space-card-icon">${space.icon || '🧠'}</div>
      <div class="space-card-name">${escHtml(space.name)}</div>
      <div class="space-card-meta">Узлов: ${nodeCount} | Связей: ${edgeCount}</div>
      <button class="space-card-del" onclick="deleteSpace(event,'${space.id}')">✕</button>
    `;
    card.onclick = () => openSpace(space.id);
    grid.appendChild(card);
  });
  const newCard = document.createElement('div');
  newCard.className = 'space-card space-card-new';
  newCard.innerHTML = `<div class="space-card-new-icon">＋</div><div class="space-card-new-label">Новое пространство</div>`;
  newCard.onclick = () => openNewSpaceModal();
  grid.appendChild(newCard);
}

function deleteSpace(e, id) {
  e.stopPropagation();
  if (!confirm('Удалить пространство и все его узлы?')) return;
  state.spaces = state.spaces.filter(s => s.id !== id);
  Object.keys(state.nodes).forEach(k => { if (state.nodes[k].spaceId === id) delete state.nodes[k]; });
  Object.keys(state.edges).forEach(k => { if (state.edges[k].spaceId === id) delete state.edges[k]; });
  saveState();
  renderHub();
  showToast('🗑 Пространство удалено');
}

function openSpace(id) {
  state.currentSpaceId = id;
  state.view = { x: 60, y: 60, scale: 1 };
  state.selectedNodeId = null;
  state.connectSource = null;
  showPage('engine');
}

// ===== PROFILE MODAL =====
function openProfileModal() {
  if (!state.currentUser) return;
  const user = state.users[state.currentUser];
  const spacesCount = state.spaces.length;
  const totalNodes = Object.values(state.nodes).filter(n => state.spaces.some(s => s.id === n.spaceId)).length;
  const totalEdges = Object.values(state.edges).filter(e => state.spaces.some(s => s.id === e.spaceId)).length;
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '👤 Профиль пользователя';
  document.getElementById('modal-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent3));display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:18px;font-weight:700;color:var(--bg)">${user.nick.substring(0,2).toUpperCase()}</div>
      <div>
        <div style="font-family:'Orbitron',monospace;font-size:16px;color:var(--text)">${escHtml(user.nick)}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text-dim)">${escHtml(state.currentUser)}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:var(--glass);border:1px solid var(--border);padding:12px;text-align:center;border-radius:2px">
        <div style="font-family:'Orbitron',monospace;font-size:20px;color:var(--accent)">${spacesCount}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:1px">ПРОСТРАНСТВ</div>
      </div>
      <div style="background:var(--glass);border:1px solid var(--border);padding:12px;text-align:center;border-radius:2px">
        <div style="font-family:'Orbitron',monospace;font-size:20px;color:var(--accent)">${totalNodes}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:1px">УЗЛОВ</div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="modal-btn modal-btn-primary" onclick="showPage('settings');closeModal()"><span>⚙ НАСТРОЙКИ</span></button>
      <button class="modal-btn modal-btn-secondary" onclick="closeModal()">ЗАКРЫТЬ</button>
    </div>
  `;
  modal.style.display = 'flex';
}

// ===== NEW SPACE MODAL =====
function openNewSpaceModal() {
  newSpaceEmoji = '🧠';
  newSpaceColor = '#00f5ff';
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '// Новое пространство';
  document.getElementById('modal-body').innerHTML = `
    <input class="modal-input" type="text" id="new-space-name" placeholder="Название пространства..." autofocus>
    <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:2px;margin-bottom:10px;text-transform:uppercase">Иконка</div>
    <div class="modal-emoji-row">
      ${EMOJIS.map(e => `<div class="modal-emoji ${e===newSpaceEmoji?'active':''}" onclick="selectEmoji('${e}',this)">${e}</div>`).join('')}
    </div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:2px;margin-bottom:10px;text-transform:uppercase">Цвет</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
      ${COLORS.map(c => `<div style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${c===newSpaceColor?'white':'transparent'};transition:all 0.2s" onclick="selectSpaceColor('${c}',this)"></div>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="modal-btn modal-btn-primary" onclick="createSpace()"><span>⚡ СОЗДАТЬ</span></button>
      <button class="modal-btn modal-btn-secondary" onclick="closeModal()">ОТМЕНА</button>
    </div>
  `;
  modal.style.display = 'flex';
  setTimeout(() => {
    const input = document.getElementById('new-space-name');
    if (input) {
      input.focus();
      input.addEventListener('keydown', e => { if (e.key === 'Enter') createSpace(); });
    }
  }, 100);
}

function selectEmoji(e, el) {
  newSpaceEmoji = e;
  document.querySelectorAll('.modal-emoji').forEach(el2 => el2.classList.remove('active'));
  el.classList.add('active');
}

function selectSpaceColor(c, el) {
  newSpaceColor = c;
  document.querySelectorAll('#modal-body [style*="border-radius:50%"]').forEach(el2 => el2.style.borderColor = 'transparent');
  el.style.borderColor = 'white';
}

function createSpace() {
  const name = document.getElementById('new-space-name')?.value.trim();
  if (!name) { showToast('⚠ Введите название'); return; }
  const space = { id: 'sp_' + (++state.spaceIdCounter), name, icon: newSpaceEmoji, color: newSpaceColor };
  state.spaces.unshift(space);
  saveState();
  closeModal();
  showToast('✓ Пространство "' + name + '" создано');
  renderHub();
}

function handleModalClick(e) {
  if (e.currentTarget === e.target) {
    closeModal();
  }
}
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// ===== ENGINE =====
function renderEngine() {
  const space = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!space) return;
  document.getElementById('engine-space-name').textContent = space.name;
  applyAccentColor();
  const swatchContainer = document.getElementById('color-swatches');
  if (swatchContainer) {
    swatchContainer.innerHTML = NODE_COLORS.map((c, i) =>
      `<div class="color-swatch" style="background:${c.bg};border-color:${c.dot}" onclick="selectNodeColor(${i})" data-idx="${i}" title="${c.label}"></div>`
    ).join('');
  }
  const searchInput = document.getElementById('node-search');
  if (searchInput) searchInput.value = '';
  setTool('select');
  renderCanvas();
  applyView();
}

function getSpaceNodes() {
  return Object.values(state.nodes).filter(n => n.spaceId === state.currentSpaceId);
}
function getSpaceEdges() {
  return Object.values(state.edges).filter(e => e.spaceId === state.currentSpaceId);
}

function renderCanvas() {
  const world = document.getElementById('canvas-world');
  if (!world) return;
  world.querySelectorAll('.node').forEach(n => n.remove());
  const nodes = getSpaceNodes();
  nodes.forEach(node => world.appendChild(createNodeEl(node)));
  renderEdges();
  updateStats();
}

function createNodeEl(node) {
  const colorSet = NODE_COLORS[node.colorIdx || 0];
  const div = document.createElement('div');
  div.className = 'node';
  div.id = 'node-' + node.id;
  div.style.left = node.x + 'px';
  div.style.top = node.y + 'px';
  div.style.background = colorSet.bg;
  div.style.borderColor = colorSet.dot;
  if (node.id === state.selectedNodeId) div.classList.add('selected');
  const tagsHtml = node.tags ? node.tags.split(',').map(t => `<span class="node-tag">${escHtml(t.trim())}</span>`).join('') : '';
  div.innerHTML = `
    <div class="node-in-handle" data-node="${node.id}"></div>
    <div class="node-header">
      <div class="node-dot" style="background:${colorSet.dot};box-shadow:0 0 8px ${colorSet.dot}"></div>
      <div class="node-title">${escHtml(node.title)}</div>
    </div>
    ${node.desc ? `<div class="node-desc">${escHtml(node.desc)}</div>` : ''}
    ${tagsHtml ? `<div class="node-tags">${tagsHtml}</div>` : ''}
    <div class="node-actions">
      <button class="node-action-btn" onclick="editNode(event,'${node.id}')">EDIT</button>
      <button class="node-action-btn" onclick="addSubnode(event,'${node.id}')">+SUB</button>
      <button class="node-action-btn danger" onclick="deleteNode(event,'${node.id}')">DEL</button>
    </div>
    <div class="node-connect-handle" data-node="${node.id}"></div>
  `;
  div.addEventListener('mousedown', (e) => onNodeMouseDown(e, node.id));
  const handle = div.querySelector('.node-connect-handle');
  if (handle) handle.addEventListener('mousedown', (e) => { e.stopPropagation(); startConnect(node.id, e); });
  return div;
}

function renderEdges() {
  const svg = document.getElementById('main-edges-svg');
  if (!svg) return;
  svg.innerHTML = '';
  const edges = getSpaceEdges();
  edges.forEach(edge => {
    const fromNode = state.nodes[edge.from];
    const toNode = state.nodes[edge.to];
    if (!fromNode || !toNode) return;
    const x1 = fromNode.x + 140;
    const y1 = fromNode.y + 30;
    const x2 = toNode.x;
    const y2 = toNode.y + 30;
    const cx = (x1 + x2) / 2;
    
    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
    bgPath.setAttribute('class', 'edge-path-bg');
    svg.appendChild(bgPath);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', 'edge-path');
    path.setAttribute('data-edge', edge.id);
    path.addEventListener('click', () => {
      if (confirm('Удалить связь?')) {
        delete state.edges[edge.id];
        saveState();
        renderCanvas();
        showToast('🗑 Связь удалена');
      }
    });
    svg.appendChild(path);
  });
}

// ===== DRAG & PAN =====
function onNodeMouseDown(e, nodeId) {
  if (e.target.tagName === 'BUTTON') return;
  if (e.target.classList.contains('node-connect-handle')) return;
  e.stopPropagation();
  if (state.tool === 'connect') {
    if (state.connectSource && state.connectSource !== nodeId) { finishConnect(nodeId); }
    else { startConnect(nodeId, e); }
    return;
  }
  selectNode(nodeId);
  const node = state.nodes[nodeId];
  const startX = e.clientX;
  const startY = e.clientY;
  const startNX = node.x;
  const startNY = node.y;
  state.dragging = nodeId;
  document.getElementById('node-' + nodeId)?.classList.add('dragging');
  const onMove = (ev) => {
    const dx = (ev.clientX - startX) / state.view.scale;
    const dy = (ev.clientY - startY) / state.view.scale;
    node.x = startNX + dx;
    node.y = startNY + dy;
    const el = document.getElementById('node-' + nodeId);
    if (el) { el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; }
    renderEdges();
  };
  const onUp = () => {
    state.dragging = null;
    document.getElementById('node-' + nodeId)?.classList.remove('dragging');
    saveState();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function applyView() {
  const world = document.getElementById('canvas-world');
  if (!world) return;
  world.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
  const zoomLabel = document.getElementById('zoom-label');
  if (zoomLabel) zoomLabel.textContent = Math.round(state.view.scale * 100) + '%';
}

function zoom(factor, cx, cy) {
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const mx = (cx ?? rect.width/2) - rect.left;
  const my = (cy ?? rect.height/2) - rect.top;
  const newScale = Math.min(3, Math.max(0.2, state.view.scale * factor));
  state.view.x = mx - (mx - state.view.x) * (newScale / state.view.scale);
  state.view.y = my - (my - state.view.y) * (newScale / state.view.scale);
  state.view.scale = newScale;
  applyView();
}

function fitView() {
  const nodes = getSpaceNodes();
  if (!nodes.length) { state.view = {x:60,y:60,scale:1}; applyView(); return; }
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const minX = Math.min(...nodes.map(n=>n.x));
  const maxX = Math.max(...nodes.map(n=>n.x)) + 160;
  const minY = Math.min(...nodes.map(n=>n.y));
  const maxY = Math.max(...nodes.map(n=>n.y)) + 60;
  const w = maxX - minX;
  const h = maxY - minY;
  const scaleX = (rect.width - 80) / w;
  const scaleY = (rect.height - 80) / h;
  const scale = Math.min(1.5, Math.max(0.3, Math.min(scaleX, scaleY)));
  state.view.scale = scale;
  state.view.x = (rect.width - w * scale) / 2 - minX * scale;
  state.view.y = (rect.height - h * scale) / 2 - minY * scale;
  applyView();
}

// ===== TOOLS =====
function setTool(tool) {
  state.tool = tool;
  ['select','node','connect'].forEach(t => {
    const btn = document.getElementById('tool-' + t);
    if (btn) btn.classList.toggle('active', t === tool);
  });
  if (tool !== 'connect') cancelConnect();
  const wrap = document.getElementById('canvas-wrap');
  if (wrap) wrap.style.cursor = tool === 'node' ? 'crosshair' : 'default';
}

function addNodeAt(e) {
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const x = (e.clientX - rect.left - state.view.x) / state.view.scale;
  const y = (e.clientY - rect.top - state.view.y) / state.view.scale;
  createNode(x - 70, y - 30, 'Новая идея', '');
}

function createNode(x, y, title, desc, colorIdx) {
  const id = 'n_' + (++state.nodeIdCounter);
  state.nodes[id] = {
    id,
    spaceId: state.currentSpaceId,
    x,
    y,
    title: title || 'Новая идея',
    desc: desc || '',
    tags: '',
    colorIdx: colorIdx || 0
  };
  saveState();
  const world = document.getElementById('canvas-world');
  if (world) world.appendChild(createNodeEl(state.nodes[id]));
  updateStats();
  selectNode(id);
  showToast('✓ Узел добавлен');
  return id;
}

function getQuickCapturePosition(index, total) {
  const wrap = document.getElementById('canvas-wrap');
  const rect = wrap ? wrap.getBoundingClientRect() : { width: 900, height: 600 };
  const visibleCenterX = (rect.width / 2 - state.view.x) / state.view.scale;
  const visibleCenterY = (rect.height / 2 - state.view.y) / state.view.scale;
  const cols = Math.min(3, Math.ceil(Math.sqrt(total)));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const width = (cols - 1) * 220;
  return {
    x: visibleCenterX - width / 2 + col * 220 - 80,
    y: visibleCenterY + row * 120 - 40
  };
}

function quickCapture() {
  const input = document.getElementById('quick-capture-input');
  if (!input) return;
  const items = input.value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);

  if (!items.length) {
    showToast('Type a thought first');
    input.focus();
    return;
  }

  let lastId = null;
  items.forEach((title, index) => {
    const pos = getQuickCapturePosition(index, items.length);
    lastId = createNode(pos.x, pos.y, title, '', index % NODE_COLORS.length);
  });

  input.value = '';
  renderCanvas();
  if (lastId) selectNode(lastId);
  showToast(items.length === 1 ? 'Captured 1 thought' : `Captured ${items.length} thoughts`);
}

function addSubnode(e, parentId) {
  e.stopPropagation();
  const parent = state.nodes[parentId];
  if (!parent) return;
  const id = createNode(parent.x + 200, parent.y, 'Подтема', '');
  const eid = 'e_' + (++state.edgeIdCounter);
  state.edges[eid] = { id: eid, spaceId: state.currentSpaceId, from: parentId, to: id };
  saveState();
  renderCanvas();
  showToast('✓ Связь добавлена');
}

function deleteNode(e, nodeId) {
  e.stopPropagation();
  delete state.nodes[nodeId];
  Object.keys(state.edges).forEach(eid => {
    const edge = state.edges[eid];
    if (edge.from === nodeId || edge.to === nodeId) delete state.edges[eid];
  });
  saveState();
  if (state.selectedNodeId === nodeId) { state.selectedNodeId = null; closeNodeEditor(); }
  renderCanvas();
  showToast('🗑 Узел удалён');
}

function deleteSelected() {
  if (state.selectedNodeId) {
    deleteNode({ stopPropagation: ()=>{} }, state.selectedNodeId);
  }
}

// ===== SELECT =====
function selectNode(id) {
  state.selectedNodeId = id;
  document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
  if (id) {
    const el = document.getElementById('node-' + id);
    if (el) el.classList.add('selected');
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) deleteBtn.style.display = '';
  } else {
    closeNodeEditor();
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';
  }
}

// ===== CONNECT =====
function startConnect(nodeId, e) {
  state.connectSource = nodeId;
  setTool('connect');
  const indicator = document.getElementById('connect-indicator');
  if (indicator) indicator.classList.add('active');
  showToast('⚡ Выберите целевой узел');
}

function finishConnect(toId) {
  if (!state.connectSource || state.connectSource === toId) { cancelConnect(); return; }
  const exists = Object.values(state.edges).some(e =>
    (e.from === state.connectSource && e.to === toId) ||
    (e.from === toId && e.to === state.connectSource)
  );
  if (exists) { showToast('⚠ Связь уже существует'); cancelConnect(); return; }
  const eid = 'e_' + (++state.edgeIdCounter);
  state.edges[eid] = { id: eid, spaceId: state.currentSpaceId, from: state.connectSource, to: toId };
  saveState();
  cancelConnect();
  renderEdges();
  updateStats();
  showToast('✓ Связь создана');
}

function cancelConnect() {
  state.connectSource = null;
  const indicator = document.getElementById('connect-indicator');
  if (indicator) indicator.classList.remove('active');
  const tp = document.getElementById('temp-edge-path');
  if (tp) tp.style.display = 'none';
}

function updateTempEdge(e) {
  if (!state.connectSource) return;
  const fromNode = state.nodes[state.connectSource];
  if (!fromNode) return;
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const x1 = fromNode.x * state.view.scale + state.view.x + 140 * state.view.scale;
  const y1 = fromNode.y * state.view.scale + state.view.y + 30 * state.view.scale;
  const x2 = e.clientX - rect.left;
  const y2 = e.clientY - rect.top;
  const cx = (x1 + x2) / 2;
  const path = document.getElementById('temp-edge-path');
  if (path) {
    path.setAttribute('d', `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`);
    path.style.display = '';
  }
}

// ===== NODE EDITOR =====
function editNode(e, nodeId) {
  e.stopPropagation();
  selectNode(nodeId);
  const node = state.nodes[nodeId];
  if (!node) return;
  document.getElementById('editor-title').value = node.title;
  document.getElementById('editor-desc').value = node.desc || '';
  document.getElementById('editor-tags').value = node.tags || '';
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.idx) === (node.colorIdx || 0));
  });
  const connEl = document.getElementById('editor-connections');
  if (connEl) {
    const edges = getSpaceEdges().filter(e => e.from === nodeId || e.to === nodeId);
    const connectedIds = edges.map(e => e.from === nodeId ? e.to : e.from);
    const connectedNodes = connectedIds.map(id => state.nodes[id]).filter(Boolean);
    connEl.innerHTML = connectedNodes.length
      ? connectedNodes.map(n => `<span class="connected-node-badge" onclick="selectNode('${n.id}')">${escHtml(n.title)}</span>`).join('')
      : '<span style="color:var(--text-dim)">Нет связей</span>';
  }
  document.getElementById('node-editor')?.classList.add('open');
}

function selectNodeColor(idx) {
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.idx) === idx);
  });
  if (state.selectedNodeId) {
    state.nodes[state.selectedNodeId].colorIdx = idx;
    const colorSet = NODE_COLORS[idx];
    const el = document.getElementById('node-' + state.selectedNodeId);
    if (el) {
      el.style.background = colorSet.bg;
      el.style.borderColor = colorSet.dot;
      const dot = el.querySelector('.node-dot');
      if (dot) { dot.style.background = colorSet.dot; dot.style.boxShadow = `0 0 8px ${colorSet.dot}`; }
    }
  }
}

function saveNodeEdit() {
  if (!state.selectedNodeId) return;
  const node = state.nodes[state.selectedNodeId];
  if (!node) return;
  node.title = document.getElementById('editor-title')?.value || 'Без названия';
  node.desc = document.getElementById('editor-desc')?.value || '';
  node.tags = document.getElementById('editor-tags')?.value || '';
  const activeColor = document.querySelector('.color-swatch.active');
  if (activeColor) node.colorIdx = parseInt(activeColor.dataset.idx);
  saveState();
  const el = document.getElementById('node-' + node.id);
  if (el) {
    const titleEl = el.querySelector('.node-title');
    if (titleEl) titleEl.textContent = node.title;
    const descEl = el.querySelector('.node-desc');
    if (node.desc) {
      if (descEl) descEl.textContent = node.desc;
      else {
        const headerEl = el.querySelector('.node-header');
        if (headerEl) headerEl.insertAdjacentHTML('afterend', `<div class="node-desc">${escHtml(node.desc)}</div>`);
      }
    } else if (descEl) descEl.remove();
    const tagsContainer = el.querySelector('.node-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = node.tags
        ? node.tags.split(',').map(t => `<span class="node-tag">${escHtml(t.trim())}</span>`).join('')
        : '';
    } else if (node.tags) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'node-tags';
      tagsDiv.innerHTML = node.tags.split(',').map(t => `<span class="node-tag">${escHtml(t.trim())}</span>`).join('');
      const actionsEl = el.querySelector('.node-actions');
      if (actionsEl) actionsEl.before(tagsDiv);
    }
  }
  closeNodeEditor();
  showToast('✓ Сохранено');
}

function closeNodeEditor() {
  document.getElementById('node-editor')?.classList.remove('open');
}

// ===== AUTO LAYOUT =====
function autoLayout() {
  const nodes = getSpaceNodes();
  if (!nodes.length) return;
  const cols = Math.ceil(Math.sqrt(nodes.length));
  nodes.forEach((n, i) => {
    n.x = 60 + (i % cols) * 220;
    n.y = 60 + Math.floor(i / cols) * 140;
  });
  saveState();
  renderCanvas();
  fitView();
  showToast('✓ Авто-размещение применено');
}

// ===== STATS =====
function updateStats() {
  const nodeCount = getSpaceNodes().length;
  const edgeCount = getSpaceEdges().length;
  const statNodes = document.getElementById('stat-nodes');
  const statEdges = document.getElementById('stat-edges');
  const statDensity = document.getElementById('stat-density');
  if (statNodes) statNodes.textContent = nodeCount;
  if (statEdges) statEdges.textContent = edgeCount;
  if (statDensity) {
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxEdges > 0 ? Math.round((edgeCount / maxEdges) * 100) : 0;
    statDensity.textContent = density + '%';
  }
}

// ===== SMART CONNECT =====
function smartConnect() {
  const nodes = getSpaceNodes();
  if (nodes.length < 2) { showToast('⚠ Нужно минимум 2 узла'); return; }
  const progressDiv = document.getElementById('smart-connect-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
if (progressDiv) {
  progressDiv.style.display = 'block';
  progressDiv.style.opacity = '1';
}
if (progressFill) progressFill.style.width = '0%';
if (progressText) progressText.textContent = 'Анализ узлов...';
  const existingEdges = new Set();
  getSpaceEdges().forEach(e => existingEdges.add(e.from + '|' + e.to));
  let totalPairs = nodes.length * (nodes.length - 1) / 2;
  let processed = 0;
  let newEdges = 0;
  let i = 0, j = 1;
  function tokenize(text) {
    return text.toLowerCase().replace(/[^\w\sа-яё]/g, '').split(/\s+/).filter(w => w.length > 2);
  }
  function step() {
    if (i >= nodes.length) {
     if (progressText) progressText.textContent = 'Готово ✓';

if (progressDiv) {
  setTimeout(() => {
    progressDiv.style.opacity = '0';

    setTimeout(() => {
      progressDiv.style.display = 'none';
    }, 300);
  }, 700);
}
      saveState();
      renderCanvas();
      showToast(`🧠 Создано ${newEdges} новых связей`);
      return;
    }
    if (j >= nodes.length) {
      i++;
      j = i + 1;
      if (i >= nodes.length) { step(); return; }
    }
    const a = nodes[i], b = nodes[j];
    const key1 = a.id + '|' + b.id;
    const key2 = b.id + '|' + a.id;
    if (!existingEdges.has(key1) && !existingEdges.has(key2)) {
      const textA = (a.title + ' ' + (a.desc || '') + ' ' + (a.tags || '')).toLowerCase();
      const textB = (b.title + ' ' + (b.desc || '') + ' ' + (b.tags || '')).toLowerCase();
      const tokensA = new Set(tokenize(textA));
      const tokensB = tokenize(textB);
      const common = tokensB.filter(t => tokensA.has(t)).length;
      const totalTokens = new Set([...tokensA, ...tokensB]).size;
      const similarity = totalTokens > 0 ? common / totalTokens : 0;
      if (similarity >= 0.3) {
        const eid = 'e_' + (++state.edgeIdCounter);
        state.edges[eid] = { id: eid, spaceId: state.currentSpaceId, from: a.id, to: b.id };
        existingEdges.add(key1);
        existingEdges.add(key2);
        newEdges++;
      }
    }
    processed++;
    j++;
    const pct = Math.min(100, Math.round((processed / totalPairs) * 100));
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = `Анализ: ${processed}/${totalPairs} пар`;
    setTimeout(step, 0);
  }
  step();
}

// ===== SEARCH =====
function searchNodes() {
  const query = document.getElementById('node-search')?.value.trim().toLowerCase();
  document.querySelectorAll('.node').forEach(el => el.classList.remove('search-highlight'));
  if (!query) return;
  getSpaceNodes().forEach(node => {
    const text = (node.title + ' ' + (node.desc || '') + ' ' + (node.tags || '')).toLowerCase();
    if (text.includes(query)) {
      document.getElementById('node-' + node.id)?.classList.add('search-highlight');
    }
  });
}

// ===== EXPORT / IMPORT =====
function exportSpaceJSON() {
  const space = state.spaces.find(s => s.id === state.currentSpaceId);
  if (!space) return;
  const data = {
    space: space,
    nodes: getSpaceNodes(),
    edges: getSpaceEdges().map(e => ({ id: e.id, from: e.from, to: e.to })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (space.name || 'space').replace(/[^a-zа-яё0-9]/gi,'_') + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📋 Экспортировано');
}

function importSpaceJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const data = JSON.parse(re.target.result);
        if (!data.space || !data.nodes) throw new Error('Invalid format');
        const newSpaceId = 'sp_' + (++state.spaceIdCounter);
        data.space.id = newSpaceId;
        state.spaces.push(data.space);
        const idMap = {};
        data.nodes.forEach(n => {
          const newId = 'n_' + (++state.nodeIdCounter);
          idMap[n.id] = newId;
          state.nodes[newId] = { ...n, id: newId, spaceId: newSpaceId };
        });
        if (data.edges) {
          data.edges.forEach(e => {
            const newId = 'e_' + (++state.edgeIdCounter);
            state.edges[newId] = { id: newId, spaceId: newSpaceId, from: idMap[e.from] || e.from, to: idMap[e.to] || e.to };
          });
        }
        saveState();
        showToast('📥 Пространство импортировано');
        showPage('hub');
      } catch (err) { showToast('⚠ Ошибка файла'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ===== SETTINGS =====
function setSettingsTab(tab) {
  document.querySelectorAll('.settings-nav-item').forEach((el, i) => {
    const tabs = ['appearance', 'profile', 'data', 'about'];
    el.classList.toggle('active', tabs[i] === tab);
  });
  renderSettings(tab);
}

function renderSettings(tab) {
  const el = document.getElementById('settings-content');
  if (!el) return;
  if (tab === 'appearance') {
    el.innerHTML = `
      <div class="settings-section-title">Внешний <span>Вид</span></div>
      <div class="settings-section-sub">// Настройка интерфейса</div>
      <div class="settings-group">
        <div class="settings-group-title">Тема</div>
        <div class="theme-cards">
          <div class="theme-card ${state.theme==='cyber'?'active':''}" onclick="applyTheme('cyber')"><div class="theme-card-preview" style="background:#040810"><div class="theme-card-bar" style="background:#00f5ff;width:80%"></div><div class="theme-card-bar" style="background:rgba(0,245,255,0.3);width:60%"></div></div><div class="theme-card-label">CYBER</div></div>
          <div class="theme-card ${state.theme==='glass'?'active':''}" onclick="applyTheme('glass')"><div class="theme-card-preview" style="background:linear-gradient(135deg,#1a1040,#0a1530)"><div class="theme-card-bar" style="background:rgba(255,255,255,0.6);width:80%"></div><div class="theme-card-bar" style="background:rgba(255,255,255,0.3);width:60%"></div></div><div class="theme-card-label">GLASS</div></div>
          <div class="theme-card ${state.theme==='neon'?'active':''}" onclick="applyTheme('neon')"><div class="theme-card-preview" style="background:#0a000f"><div class="theme-card-bar" style="background:#ff006e;width:80%"></div><div class="theme-card-bar" style="background:#7b2fff;width:60%"></div></div><div class="theme-card-label">NEON</div></div>
        </div>
      </div>
      <div class="settings-group">
        <div class="settings-group-title">Акцентный цвет</div>
        <div class="accent-colors">
          ${COLORS.map(c => `<div class="accent-btn ${state.accentColor===c?'active':''}" style="background:${c}" onclick="applyAccent('${c}')"></div>`).join('')}
        </div>
      </div>
    `;
  } else if (tab === 'profile') {
    const user = state.users[state.currentUser] || {};
    el.innerHTML = `
      <div class="settings-section-title">Профиль <span>Пользователя</span></div>
      <div class="settings-section-sub">// Персональные данные</div>
      <div class="settings-group">
        <div class="settings-group-title">Никнейм</div>
        <input class="editor-input" type="text" id="profile-nick" value="${escHtml(user.nick || '')}" style="max-width:300px;margin-bottom:12px">
        <button class="editor-save-btn" style="max-width:160px" onclick="saveProfile()"><span>СОХРАНИТЬ</span></button>
      </div>
    `;
  } else if (tab === 'data') {
    el.innerHTML = `
      <div class="settings-section-title">Управление <span>Данными</span></div>
      <div class="settings-section-sub">// Экспорт и импорт всей базы</div>
      <div class="settings-group">
        <button class="hub-download-btn" onclick="exportAllData()" style="margin-right:10px">⬇ Экспорт всей базы</button>
        <button class="hub-download-btn" onclick="importAllData()">📥 Импорт всей базы</button>
        <div style="margin-top:16px;font-size:12px;color:var(--text-dim)">Хранилище: localStorage (может быть ограничено)</div>
      </div>
    `;
  } else if (tab === 'about') {
    el.innerHTML = `
      <div class="settings-section-title">О <span>NeuroSpace</span></div>
      <div class="settings-section-sub">// Цифровой расширитель памяти v2.1</div>
      <div class="settings-group">
        <p style="color:var(--text-dim);line-height:1.6">Создано для визуализации и связывания идей. Все данные хранятся локально в вашем браузере.</p>
      </div>
    `;
  }
}

function applyTheme(theme) {
  state.theme = theme;
  saveState();
  const themes = {
    cyber: { bg: '#040810', bg2: '#080f1a', bg3: '#0d1829' },
    glass: { bg: '#0d0a20', bg2: '#120f2a', bg3: '#171330' },
    neon: { bg: '#0a000f', bg2: '#100015', bg3: '#150020' },
  };
  const t = themes[theme];
  if (t) {
    document.documentElement.style.setProperty('--bg', t.bg);
    document.documentElement.style.setProperty('--bg2', t.bg2);
    document.documentElement.style.setProperty('--bg3', t.bg3);
  }
  document.querySelectorAll('.theme-card').forEach(el => {
    el.classList.toggle('active', el.querySelector('.theme-card-label')?.textContent.toLowerCase() === theme);
  });
  showToast('✓ Тема изменена: ' + theme.toUpperCase());
}

function applyAccent(color) {
  state.accentColor = color;
  saveState();
  applyAccentColor();
  document.querySelectorAll('.accent-btn').forEach(el => {
    el.classList.toggle('active', el.style.background === color);
  });
  showToast('✓ Акцентный цвет изменён');
}

function applyAccentColor() {
  document.documentElement.style.setProperty('--accent', state.accentColor);
  document.documentElement.style.setProperty('--border', `rgba(${hexToRgb(state.accentColor)},0.18)`);
  document.documentElement.style.setProperty('--glass', `rgba(${hexToRgb(state.accentColor)},0.04)`);
  document.documentElement.style.setProperty('--glass2', `rgba(${hexToRgb(state.accentColor)},0.08)`);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function saveProfile() {
  const nickInput = document.getElementById('profile-nick');
  if (!nickInput) return;
  const nick = nickInput.value.trim();
  if (!nick) return;
  if (state.users[state.currentUser]) {
    state.users[state.currentUser].nick = nick;
    saveState();
    showToast('✓ Профиль сохранён');
    renderHub();
  }
}

function exportAllData() {
  const blob = new Blob([JSON.stringify({
    users: state.users,
    spaces: state.spaces,
    nodes: state.nodes,
    edges: state.edges,
    theme: state.theme,
    accentColor: state.accentColor,
  }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'neurospace_full_backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📋 Полный бэкап сохранён');
}

function importAllData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const data = JSON.parse(re.target.result);
        if (confirm('Заменить все данные? Текущие данные будут потеряны.')) {
          state.users = data.users || {};
          state.spaces = data.spaces || [];
          state.nodes = data.nodes || {};
          state.edges = data.edges || {};
          state.theme = data.theme || 'cyber';
          state.accentColor = data.accentColor || '#00f5ff';
          saveState();
          showToast('📥 Данные импортированы');
          showPage('hub');
        }
      } catch (err) { showToast('⚠ Ошибка файла'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ===== AI PANEL =====
function toggleAIPanel() {
  const panel = document.getElementById('ai-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) generateAIResponse();
}

function closeAIPanel() {
  document.getElementById('ai-panel')?.classList.remove('open');
}

function generateAIResponse() {
  const responseEl = document.getElementById('ai-response-content');
  if (!responseEl) return;
  responseEl.innerHTML = '<div class="ai-loading">Анализ графа...</div>';
  const nodes = getSpaceNodes();
  const edges = getSpaceEdges();
  if (nodes.length === 0) {
    responseEl.innerHTML = '<p>Нет узлов для анализа.</p>';
    return;
  }
  let context = 'Граф знаний:\n';
  nodes.forEach(n => {
    context += `- [${n.title}] ${n.desc || ''} (теги: ${n.tags || 'нет'})\n`;
  });
  context += '\nСвязи:\n';
  edges.forEach(e => {
    const from = state.nodes[e.from]?.title || '?';
    const to = state.nodes[e.to]?.title || '?';
    context += `${from} ↔ ${to}\n`;
  });
  setTimeout(() => {
    const ideas = [
      'Объедините узлы «Главная идея» и «Направление A» в новый подпроект для лучшей организации.',
      'Узел «Конкретный шаг» слабо связан — добавьте промежуточные задачи.',
      'Обнаружена кластеризация: два направления развития. Создайте отдельные пространства.',
      'Добавьте тег «важное» к срочным узлам для быстрой фильтрации.',
    ];
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
    responseEl.innerHTML = `
      <p>🧠 <strong>AI-ассистент (локальный)</strong></p>
      <p>${randomIdea}</p>
      <p style="margin-top:12px;color:var(--text-dim);font-size:12px;">Контекст графа готов к отправке во внешний ИИ.</p>
      <p style="color:var(--text-dim);font-size:10px;">${context.replace(/\n/g,'<br>')}</p>
    `;
  }, 800);
}

// ===== UTILS =====
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function downloadSite(e) {
  e.preventDefault();
  const html = document.documentElement.outerHTML;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'neurospace.html';
  a.click();
  URL.revokeObjectURL(url);
  showToast('⬇ Код загружается...');
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyAccentColor();
  if (state.theme) applyTheme(state.theme);
  if (state.currentUser) showPage('hub');
  else showPage('gate');

  // Кнопка Enter на странице входа
  const loginPass = document.getElementById('login-pass');
  if (loginPass) loginPass.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

  // Клик по профилю в хабе
  const hubUser = document.querySelector('.hub-user');
  if (hubUser) hubUser.addEventListener('click', openProfileModal);

  const quickInput = document.getElementById('quick-capture-input');
  if (quickInput) {
    quickInput.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        quickCapture();
      }
    });
  }

  // Canvas listeners
  const wrap = document.getElementById('canvas-wrap');
  if (wrap) {
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap || e.target.id === 'canvas-world' || e.target.closest('#grid-svg') || e.target.closest('#main-edges-svg')) {
        if (state.tool === 'node') { addNodeAt(e); return; }
        if (state.tool === 'connect') { cancelConnect(); return; }
        state.panning = true;
        state.panStart = { x: e.clientX - state.view.x, y: e.clientY - state.view.y };
        selectNode(null);
        closeNodeEditor();
      }
    });
    wrap.addEventListener('dblclick', (e) => {
      if (state.tool === 'select') addNodeAt(e);
    });
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom(e.deltaY > 0 ? 0.9 : 1.1, e.clientX, e.clientY);
    }, { passive: false });
  }

  document.addEventListener('mousemove', (e) => {
    if (state.panning) {
      state.view.x = e.clientX - state.panStart.x;
      state.view.y = e.clientY - state.panStart.y;
      applyView();
    }
    if (state.connectSource) updateTempEdge(e);
  });
  document.addEventListener('mouseup', () => { state.panning = false; });

  document.addEventListener('click', (e) => {
    if (!state.connectSource) return;
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      const id = nodeEl.id.replace('node-', '');
      finishConnect(id);
    }
  });
});

document.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName);
  if (e.key === 'Escape') { cancelConnect(); closeNodeEditor(); setTool('select'); }
  if (!typing && e.key === 'Delete' && state.selectedNodeId) deleteSelected();
  if (!typing && e.key === 'n' && !e.ctrlKey && !e.metaKey && document.getElementById('engine')?.classList.contains('active')) setTool('node');
  if (!typing && e.ctrlKey && e.key === 's') { e.preventDefault(); saveNodeEdit(); }
});
