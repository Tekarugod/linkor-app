const { supabase } = require('./supabaseClient');
const path = require('path');
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');

let currentSupabaseUserId = null;
let mainWindow = null;

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

ipcMain.handle('app:open-external', async (_event, url) => {
  await shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle('app:check-updates', async () => {
  if (!app.isPackaged) {
    return { ok: false, message: 'Оновлення працюють тільки у встановленій production-версії.' };
  }

  await autoUpdater.checkForUpdates();
  return { ok: true, message: 'Перевіряю оновлення...' };
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

    return {
      ok: true,
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

    const nick =
      data.user?.user_metadata?.nick ||
      data.user?.email?.split('@')[0] ||
      'User';

    return {
      ok: true,
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
    currentSupabaseUserId = null;
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
    title: 'Nodus AI',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

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
