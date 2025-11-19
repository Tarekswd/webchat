import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  room: string;
  author: string;
  content: string;
  time: string;
}

let socket: Socket | null = null;

const API_URL = 'http://localhost:3000';

function getAvatarColor(name: string) {
  const colors = ['#f97316', '#22c55e', '#38bdf8', '#a855f7', '#eab308'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
}

function makeDmRoom(a: string, b: string) {
  const pair = [a.toLowerCase(), b.toLowerCase()].sort();
  return `dm:${pair[0]}:${pair[1]}`;
}

const ChatRoom: React.FC = () => {
  const [connected, setConnected] = useState(false);

  const [room, setRoom] = useState('general');

  const [username, setUsername] = useState(
    () => localStorage.getItem('chat_username') || 'Guest',
  );
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('chat_token') || null,
  );

  const [chatMode, setChatMode] = useState<'room' | 'dm'>('room');
  const [currentDmTarget, setCurrentDmTarget] = useState<string | null>(null);
  const [dmInput, setDmInput] = useState('');
  const [dmContacts, setDmContacts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('chat_dm_contacts');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemMessages, setSystemMessages] = useState<string[]>([]);
  const [joined, setJoined] = useState(false);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, systemMessages, typingUser]);

  // socket connection
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      setConnected(false);
      setJoined(false);
      setJoinedRoomId(null);
      return;
    }

    socket = io(API_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => {
      setConnected(false);
      setJoined(false);
      setJoinedRoomId(null);
    });

    socket.on('system', (data: { content: string; time: string }) => {
      setSystemMessages(prev => [
        ...prev,
        `${new Date(data.time).toLocaleTimeString()} • ${data.content}`,
      ]);
    });

    socket.on('message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('history', (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });

    socket.on('typing', (payload: { author: string; time: string }) => {
      if (!payload?.author || payload.author === username) return;

      setTypingUser(payload.author);

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = window.setTimeout(
        () => setTypingUser(null),
        2000,
      );
    });

    return () => {
      socket?.disconnect();
    };
  }, [token, username]);

  // persist stuff
  useEffect(() => {
    if (username && username !== 'Guest') {
      localStorage.setItem('chat_username', username);
    }
  }, [username]);

  useEffect(() => {
    if (token) localStorage.setItem('chat_token', token);
    else localStorage.removeItem('chat_token');
  }, [token]);

  useEffect(() => {
    localStorage.setItem('chat_dm_contacts', JSON.stringify(dmContacts));
  }, [dmContacts]);

  // auth
  const authRequest = async (mode: 'login' | 'signup') => {
    if (!username.trim() || !password.trim()) return;

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.access_token) {
        setAuthError(data.message || data.error || 'Authentication failed');
        return;
      }

      setToken(data.access_token);
      setPassword('');
    } catch (err) {
      console.error('Auth error', err);
      setAuthError('Network error. Check backend.');
    } finally {
      setAuthLoading(false);
    }
  };

  const loggedIn = !!token;

  // rooms / dm
  const leaveCurrentRoom = () => {
    if (socket && joinedRoomId) socket.emit('leave', joinedRoomId);
    setJoined(false);
    setJoinedRoomId(null);
    setTypingUser(null);
  };

  const joinRoomById = (roomId: string) => {
    if (!socket || !roomId) return;
    if (joinedRoomId && joinedRoomId !== roomId) {
      socket.emit('leave', joinedRoomId);
    }
    socket.emit('join', roomId);
    setJoinedRoomId(roomId);
    setMessages([]);
    setSystemMessages([]);
    setJoined(true);
    socket.emit('history', roomId);
  };

  const handleJoinPublicRoom = () => {
    if (!socket) return;
    const roomId = room.trim();
    if (!roomId) return;

    setChatMode('room');
    setCurrentDmTarget(null);
    joinRoomById(roomId);
  };

  const openDmWith = (target: string) => {
    if (!socket || !connected) return;
    const me = username.trim();
    const peer = target.trim();
    if (!me || !peer || me.toLowerCase() === peer.toLowerCase()) return;

    if (!dmContacts.includes(peer)) {
      setDmContacts(prev => [...prev, peer]);
    }

    setChatMode('dm');
    setCurrentDmTarget(peer);

    const dmRoom = makeDmRoom(me, peer);
    joinRoomById(dmRoom);
  };

  const handleLogout = () => {
    setToken(null);
    leaveCurrentRoom();
    setMessages([]);
    setSystemMessages([]);
    setDmContacts([]);
  };

  // messaging
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !message.trim() || !joined) return;

    const trimmed = message.trim();
    let roomId: string | null = null;
    let toUsername: string | undefined;

    if (chatMode === 'room') {
      roomId = room.trim();
    } else if (chatMode === 'dm' && currentDmTarget) {
      roomId = makeDmRoom(username, currentDmTarget);
      toUsername = currentDmTarget;
    }

    if (!roomId) return;

    socket.emit('message', { room: roomId, content: trimmed, toUsername });
    setMessage('');
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    if (!socket || !joined) return;

    let roomId: string | null = null;
    if (chatMode === 'room') {
      roomId = room.trim();
    } else if (chatMode === 'dm' && currentDmTarget) {
      roomId = makeDmRoom(username, currentDmTarget);
    }
    if (!roomId) return;

    socket.emit('typing', roomId);
  };

  const getDeliveredLabel = (msg: ChatMessage, isMine: boolean) =>
    isMine ? '✓ delivered' : '';

  const currentHeaderLabel =
    chatMode === 'room'
      ? `Room • ${room}`
      : currentDmTarget
      ? `DM • ${currentDmTarget}`
      : 'Direct messages';

  return (
    <div className="chat-layout">
      {/* LEFT: account + rooms/DMs */}
      <div className="panel panel-left">
        <h2 className="panel-title">Account & Settings</h2>

        <div className="field-group">
          <label className="field-label">Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your name"
            className="input"
            disabled={loggedIn}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={loggedIn ? 'Already logged in' : 'Password'}
            className="input"
            disabled={loggedIn}
          />
        </div>

        {!loggedIn ? (
          <>
            <div className="toggle-row">
              <button
                type="button"
                className={`tab-button ${
                  authMode === 'signup' ? 'tab-button-active' : ''
                }`}
                onClick={() => setAuthMode('signup')}
              >
                Sign up
              </button>
              <button
                type="button"
                className={`tab-button ${
                  authMode === 'login' ? 'tab-button-active' : ''
                }`}
                onClick={() => setAuthMode('login')}
              >
                Login
              </button>
            </div>

            <button
              onClick={() => authRequest(authMode)}
              disabled={authLoading || !username.trim() || !password.trim()}
              className="btn btn-primary"
            >
              {authLoading
                ? authMode === 'signup'
                  ? 'Creating...'
                  : 'Logging in...'
                : authMode === 'signup'
                ? 'Create account'
                : 'Login'}
            </button>
          </>
        ) : (
          <div className="logged-in-row">
            <div className="logged-in-text">
              <span style={{ opacity: 0.7 }}>Logged in as </span>
              <strong>{username}</strong>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}

        {authError && <div className="error-text">{authError}</div>}

        <div className="divider" />

        <div className="field-group">
          <label className="field-label">Connection</label>
          <div className="status-row">
            <span
              className={`status-dot ${
                connected ? 'status-dot-online' : 'status-dot-offline'
              }`}
            />
            <span className="status-text">
              {connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>

        <div className="field-group">
          <label className="field-label">Public room</label>
          <input
            value={room}
            onChange={e => setRoom(e.target.value)}
            placeholder="general"
            className="input"
          />
        </div>

        <button
          onClick={handleJoinPublicRoom}
          disabled={!connected || !room.trim()}
          className="btn btn-success"
        >
          Join room
        </button>

        <div className="divider" />

        {/* DMs */}
        <div className="field-group">
          <label className="field-label">Direct messages</label>
          <div className="dm-start-row">
            <input
              value={dmInput}
              onChange={e => setDmInput(e.target.value)}
              placeholder="Username"
              className="input input-sm"
            />
            <button
              type="button"
              className="btn btn-secondary dm-start-btn"
              disabled={!connected || !dmInput.trim()}
              onClick={() => {
                openDmWith(dmInput);
                setDmInput('');
              }}
            >
              Start
            </button>
          </div>
        </div>

        {dmContacts.length > 0 && (
          <div className="field-group">
            <div className="dm-list">
              {dmContacts.map(contact => (
                <button
                  key={contact}
                  type="button"
                  className={`dm-pill ${
                    chatMode === 'dm' && currentDmTarget === contact
                      ? 'dm-pill-active'
                      : ''
                  }`}
                  onClick={() => openDmWith(contact)}
                >
                  <span
                    className="dm-avatar"
                    style={{ backgroundColor: getAvatarColor(contact) }}
                  >
                    {contact.charAt(0).toUpperCase()}
                  </span>
                  <span className="dm-name">{contact}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: chat area */}
      <div className="panel panel-right">
        <div className="chat-header">
          <div>
            <h2 className="panel-title">{currentHeaderLabel}</h2>
            <p className="subtitle">
              {joined
                ? `You are ${username || 'Guest'}`
                : 'Join a room or open a DM to start.'}
            </p>
          </div>
          <div className="badge-pill">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="chat-history">
          {systemMessages.map((sys, idx) => (
            <div key={`sys-${idx}`} className="system-message">
              {sys}
            </div>
          ))}

          {messages.map((msg, idx) => {
            const isMine = msg.author === username;
            const deliveredLabel = getDeliveredLabel(msg, isMine);

            return (
              <div
                key={idx}
                className={`chat-row ${isMine ? 'chat-row-mine' : ''}`}
              >
                {!isMine && (
                  <div
                    className="avatar"
                    style={{ backgroundColor: getAvatarColor(msg.author) }}
                  >
                    {msg.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div
                  className={`chat-bubble ${
                    isMine ? 'chat-bubble-mine' : 'chat-bubble-other'
                  }`}
                >
                  <div className="chat-bubble-top">
                    <div className="chat-author">{msg.author}</div>
                    <div className="chat-time">
                      {new Date(msg.time).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="chat-content">{msg.content}</div>
                  {deliveredLabel && (
                    <div className="chat-meta">{deliveredLabel}</div>
                  )}
                </div>
              </div>
            );
          })}

          {!messages.length && !systemMessages.length && (
            <div className="empty-state">
              <div className="empty-title">No messages yet</div>
              <div className="empty-text">
                Join a room or open a DM to send the first message.
              </div>
            </div>
          )}

          {typingUser && (
            <div className="typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-text">{typingUser} is typing…</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-row">
          <input
            value={message}
            onChange={e => handleMessageChange(e.target.value)}
            placeholder={
              joined ? 'Type a message…' : 'Join a room or open a DM first'
            }
            disabled={!joined}
            className="input"
          />
          <button
            type="submit"
            disabled={!joined || !message.trim()}
            className="btn btn-send"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
