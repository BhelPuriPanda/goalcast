// Singleton WebSocket manager — never closes while the app is alive
let socket = null;
const listeners = new Map(); // key: `${type}` or `${type}:${matchId}`

function getKey(type, matchId) {
  return matchId != null ? `${type}:${matchId}` : type;
}

function getOrCreate() {
  if (socket && socket.readyState <= WebSocket.OPEN) return socket;

  // In production VITE_WS_URL = wss://goalcast.onrender.com/ws
  // In development the Vite proxy forwards /ws → ws://localhost:8000/ws
  const wsUrl =
    import.meta.env.VITE_WS_URL ||
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

  socket = new WebSocket(wsUrl);

  socket.addEventListener('message', (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; }

    // match-created fires without a matchId — broadcast to all listeners of this type
    const globalKey = getKey(msg.type);
    listeners.get(globalKey)?.forEach((cb) => cb(msg.data));

    // commentary-added fires with matchId
    if (msg.data?.matchId != null) {
      const perMatchKey = getKey(msg.type, msg.data.matchId);
      listeners.get(perMatchKey)?.forEach((cb) => cb(msg.data));
    }
  });

  socket.addEventListener('open', () => {
    // Re-send any pending subscribe messages after reconnect
    pendingSubscriptions.forEach((id) => sendSubscribe(id));
  });

  socket.addEventListener('close', () => {
    socket = null;
    // Attempt reconnect after 3s
    setTimeout(getOrCreate, 3000);
  });

  return socket;
}

const pendingSubscriptions = new Set();

function sendSubscribe(matchId) {
  const ws = getOrCreate();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'subscribe', matchId }));
  }
}

function sendUnsubscribe(matchId) {
  const ws = socket;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'unsubscribe', matchId }));
  }
}

export function on(type, matchId, cb) {
  const key = getKey(type, matchId);
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(cb);
}

export function off(type, matchId, cb) {
  const key = getKey(type, matchId);
  listeners.get(key)?.delete(cb);
}

export function subscribeMatch(matchId) {
  pendingSubscriptions.add(matchId);
  sendSubscribe(matchId);
}

export function unsubscribeMatch(matchId) {
  pendingSubscriptions.delete(matchId);
  sendUnsubscribe(matchId);
}

// Boot the connection immediately
getOrCreate();
