import React from 'react';
import ChatRoom from './components/ChatRoom';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        color: '#e5e7eb',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          background: '#020617',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: '1px solid #111827',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 0.4,
                margin: 0,
              }}
            >
              JWT Protected WebChat
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                opacity: 0.65,
              }}
            >
              Real-time rooms & DMs with a simple, clean interface.
            </p>
          </div>
        </header>

        <ChatRoom />
      </div>
    </div>
  );
};

export default App;
