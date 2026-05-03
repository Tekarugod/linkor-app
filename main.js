const { supabase } = require('./supabaseClient');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

let currentSupabaseUserId = null;
let mainWindow = null;

function getAuthSessionPath() {
  return path.join(app.getPath('userData'), 'auth-session.json');
}

function writeAuthSession(session) {
  if (!session?.access_token || !session?.refresh_token) return false;

  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(getAuthSessionPath(), JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || null,
    token_type: session.token_type || 'bearer',
    user: session.user ? {
      id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata || {}
    } : null
  }, null, 2), 'utf8');

  console.log('[auth] token saved');
  return true;
}

function clearAuthSession() {
  try {
    const sessionPath = getAuthSessionPath();
    if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
  } catch (error) {
    console.warn('[auth] failed to clear stored session:', error.message);
  }
}

function readAuthSession() {
  try {
    const sessionPath = getAuthSessionPath();
    if (!fs.existsSync(sessionPath)) {
      console.log('[auth] no token found');
      return null;
    }

    const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    if (!session?.access_token || !session?.refresh_token) {
      console.log('[auth] no token found');
      return null;
    }

    return session;
  } catch (error) {
    console.warn('[auth] failed to read stored session:', error.message);
    return null;
  }
}

async function restoreAuthSession() {
  const session = readAuthSession();
  if (!session) return { ok: false, restored: false, reason: 'no-token' };

  const { data, error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });

  if (error || !data.session?.user) {
    console.warn('[auth] stored token restore failed:', error?.message || 'No user in restored session');
    clearAuthSession();
    currentSupabaseUserId = null;
    return { ok: false, restored: false, reason: 'invalid-token', error: error?.message };
  }

  currentSupabaseUserId = data.session.user.id;
  writeAuthSession(data.session);
  console.log('[auth] token restored');

  return {
    ok: true,
    restored: true,
    user: {
      id: data.session.user.id,
      email: data.session.user.email,
      nick: data.session.user.user_metadata?.nick || data.session.user.email?.split('@')[0] || 'User'
    }
  };
}

function readLocalChangelog() {
  try {
    const changelogPath = path.join(__dirname, 'changelog.json');
    if (!fs.existsSync(changelogPath)) return {};
    return JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
  } catch (error) {
    console.warn('[updates] failed to read changelog:', error.message);
    return {};
  }
}

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdateStatus(channel, data = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus('update:checking');
});

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus('update:available', info);
});

autoUpdater.on('update-not-available', (info) => {
  sendUpdateStatus('update:not-available', info);
});

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatus('update:progress', progress);
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus('update:downloaded', info);
});

autoUpdater.on('error', (error) => {
  sendUpdateStatus('update:error', {
    message: error?.message || 'Unknown update error'
  });
});

ipcMain.handle('app:quit', async () => {
  app.quit();
  return { ok: true };
});

ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('app:get-changelog', () => readLocalChangelog());

ipcMain.handle('app:open-external', async (_event, url) => {
  await shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle('app:check-updates', async () => {
  if (!app.isPackaged) {
    return { ok: false, message: 'Оновлення доступні тільки у встановленій production-версії Linkor.' };
  }

  await autoUpdater.checkForUpdates();
  return { ok: true, message: 'Перевіряю оновлення...' };
});

ipcMain.handle('app:check-updates-silent', async () => {
  if (!app.isPackaged) {
    return { ok: false, silent: true };
  }

  await autoUpdater.checkForUpdates();
  return { ok: true, silent: true };
});

ipcMain.handle('app:download-update', async () => {
  await autoUpdater.downloadUpdate();
  return { ok: true };
});

ipcMain.handle('app:install-update', () => {
  autoUpdater.quitAndInstall(false, true);
  return { ok: true };
});

async function getCurrentSupabaseUserId() {
  if (currentSupabaseUserId) return currentSupabaseUserId;

  await restoreAuthSession();
  if (currentSupabaseUserId) return currentSupabaseUserId;

  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user?.id) {
    currentSupabaseUserId = data.user.id;
  }

  return currentSupabaseUserId;
}

ipcMain.handle('auth:register', async (event, { email, password, nick } = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nick }
      }
    });

    if (error) return { ok: false, error: error.message };

    currentSupabaseUserId = data.user?.id || null;
    const sessionSaved = writeAuthSession(data.session);

    return {
      ok: true,
      sessionSaved,
      user: {
        id: data.user?.id,
        email: data.user?.email || email,
        nick
      }
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('auth:login', async (event, { email, password } = {}) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user?.id) return { ok: false, error: 'Supabase login did not return a user.' };

    currentSupabaseUserId = data.user.id;
    const sessionSaved = writeAuthSession(data.session);

    const nick =
      data.user?.user_metadata?.nick ||
      data.user?.email?.split('@')[0] ||
      'User';

    return {
      ok: true,
      sessionSaved,
      user: {
        id: data.user.id,
        email: data.user.email,
        nick
      }
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('auth:logout', async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearAuthSession();
    currentSupabaseUserId = null;
  }
});

ipcMain.handle('auth:restore', async () => {
  try {
    return await restoreAuthSession();
  } catch (error) {
    return { ok: false, restored: false, error: error.message };
  }
});

ipcMain.handle('cloud:push', async (event, payload = {}) => {
  try {
    const userId = await getCurrentSupabaseUserId();

    if (!userId) {
      return {
        ok: false,
        error: 'Not logged in to Supabase. Please log out and log in again.'
      };
    }

    const spaces = Array.isArray(payload.spaces) ? payload.spaces : [];
    const nodes = payload.nodes && typeof payload.nodes === 'object' ? payload.nodes : {};
    const edges = payload.edges && typeof payload.edges === 'object' ? payload.edges : {};
    const nodeValues = Object.values(nodes);
    const edgeValues = Object.values(edges);

    if (spaces.some(space => !space || space.id == null)) {
      return { ok: false, error: 'Invalid local spaces payload' };
    }

    if (nodeValues.some(node => !node || node.id == null || node.spaceId == null)) {
      return { ok: false, error: 'Invalid local nodes payload' };
    }

    if (edgeValues.some(edge => !edge || edge.id == null || edge.spaceId == null)) {
      return { ok: false, error: 'Invalid local edges payload' };
    }

    if (!spaces.length && (nodeValues.length || edgeValues.length)) {
      return {
        ok: false,
        error: 'Refusing to sync nodes or edges without spaces'
      };
    }

    if (!spaces.length) {
      const { count, error } = await supabase
        .from('spaces')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      if ((count || 0) > 0) {
        return {
          ok: false,
          error: 'Refusing to overwrite cloud with empty local data'
        };
      }
    }

    const now = new Date().toISOString();

    const spaceRows = spaces.map(space => ({
      user_id: userId,
      local_id: String(space.id),
      name: space.name || 'Untitled',
      color: space.color || null,
      icon: space.emoji || space.icon || null,
      data: space,
      updated_at: now
    }));

    let upsertedSpaces = [];

    if (spaceRows.length) {
      const { data, error } = await supabase
        .from('spaces')
        .upsert(spaceRows, { onConflict: 'user_id,local_id' })
        .select();

      if (error) throw error;
      upsertedSpaces = data || [];
    }

    const spaceMap = {};
    upsertedSpaces.forEach(space => {
      spaceMap[String(space.local_id)] = space.id;
    });

    const nodeRows = nodeValues.map(node => ({
      user_id: userId,
      space_id: spaceMap[String(node.spaceId)] || null,
      local_id: String(node.id),
      local_space_id: String(node.spaceId || ''),
      data: node,
      updated_at: now
    }));

    if (nodeRows.length) {
      const { error } = await supabase
        .from('nodes')
        .upsert(nodeRows, { onConflict: 'user_id,local_id' });

      if (error) throw error;
    }

    const edgeRows = edgeValues.map(edge => ({
      user_id: userId,
      space_id: spaceMap[String(edge.spaceId)] || null,
      local_id: String(edge.id),
      local_space_id: String(edge.spaceId || ''),
      from_node_local_id: String(edge.from || edge.fromId || edge.source || ''),
      to_node_local_id: String(edge.to || edge.toId || edge.target || ''),
      data: edge,
      updated_at: now
    }));

    if (edgeRows.length) {
      const { error } = await supabase
        .from('edges')
        .upsert(edgeRows, { onConflict: 'user_id,local_id' });

      if (error) throw error;
    }

    return {
      ok: true,
      counts: {
        spaces: spaceRows.length,
        nodes: nodeRows.length,
        edges: edgeRows.length
      }
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('cloud:pull', async () => {
  try {
    const userId = await getCurrentSupabaseUserId();

    if (!userId) {
      return {
        ok: false,
        error: 'Not logged in to Supabase. Please log out and log in again.'
      };
    }

    const { data: spacesData, error: spacesError } = await supabase
      .from('spaces')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true });

    if (spacesError) throw spacesError;

    const { data: nodesData, error: nodesError } = await supabase
      .from('nodes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true });

    if (nodesError) throw nodesError;

    const { data: edgesData, error: edgesError } = await supabase
      .from('edges')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: true });

    if (edgesError) throw edgesError;

    const spaces = (spacesData || [])
      .map(row => row.data)
      .filter(space => space && space.id != null);

    const nodes = {};
    (nodesData || []).forEach(row => {
      const node = row.data;
      if (node && node.id != null) {
        nodes[node.id] = node;
      }
    });

    const edges = {};
    (edgesData || []).forEach(row => {
      const edge = row.data;
      if (edge && edge.id != null) {
        edges[edge.id] = edge;
      }
    });

    return {
      ok: true,
      data: {
        spaces,
        nodes,
        edges
      },
      counts: {
        spaces: spaces.length,
        nodes: Object.keys(nodes).length,
        edges: Object.keys(edges).length
      }
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Linkor',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    }
  });

// mainWindow.webContents.openDevTools();

  mainWindow.loadFile(path.join(__dirname, 'neurospace.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('ai:chat', async (_event, payload = {}) => {
  const endpoint = process.env.AI_BACKEND_ENDPOINT || '';

  if (!endpoint) {
    return {
      ok: false,
      error: 'AI backend is not configured. Set AI_BACKEND_ENDPOINT in environment.'
    };
  }

  try {
    const headers = { 'Content-Type': 'application/json' };

    if (process.env.AI_BACKEND_TOKEN) {
      headers.Authorization = `Bearer ${process.env.AI_BACKEND_TOKEN}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: payload.prompt || '',
        model: payload.model || 'gpt-4o-mini',
        timeoutMs: payload.timeout || 14000
      })
    });

    if (!response.ok) {
      return { ok: false, error: `AI backend returned ${response.status}` };
    }

    const data = await response.json();

    return {
      ok: true,
      text: data.text || data.content || data.message || ''
    };
  } catch (err) {
    return { ok: false, error: err?.message || 'AI backend request failed' };
  }
});
