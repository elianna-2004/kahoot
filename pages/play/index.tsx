import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';

export default function JoinPage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const onJoined = (data: { gameId: string; playerId: string }) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('playerId', data.playerId);
        sessionStorage.setItem('gameId', data.gameId);
      }
      setJoining(false);
      router.replace(`/play/${data.gameId}`);
    };
    const onJoinError = (data: { message: string }) => {
      setError(data.message);
      setJoining(false);
    };
    socket.on('joined-game', onJoined);
    socket.on('join-error', onJoinError);
    return () => {
      socket.off('joined-game', onJoined);
      socket.off('join-error', onJoinError);
    };
  }, [router]);

  const joinGame = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = gameCode.trim().toUpperCase();
    const name = playerName.trim() || 'Player';
    if (!code) {
      setError('Enter a game code');
      return;
    }
    setJoining(true);
    getSocket().emit('join-game', { gameCode: code, playerName: name });
  };

  return (
    <>
      <Head>
        <title>Join a game – Kahoot Clone</title>
      </Head>
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Link href="/" style={{ position: 'absolute', top: 24, left: 24, color: 'var(--text-muted)' }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 24 }}>Join a game</h1>
        <form
          onSubmit={joinGame}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
            maxWidth: 360,
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: 14 }}>
              Game code
            </label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: 14,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textAlign: 'center',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                border: '2px solid transparent',
                color: '#fff',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: 14 }}>
              Your name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nickname"
              maxLength={20}
              style={{
                width: '100%',
                padding: 14,
                fontSize: 16,
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                border: '2px solid transparent',
                color: '#fff',
              }}
            />
          </div>
          {error && <p style={{ color: 'var(--accent)', fontSize: 14 }}>{error}</p>}
          <button
            type="submit"
            disabled={joining}
            style={{
              padding: '16px',
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              color: '#fff',
              boxShadow: 'var(--shadow)',
              opacity: joining ? 0.7 : 1,
            }}
          >
            {joining ? 'Joining…' : 'Join'}
          </button>
        </form>
      </main>
    </>
  );
}
