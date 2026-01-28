import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import { SAMPLE_QUESTIONS } from '@/lib/sampleQuiz';

export default function HostPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const onCreated = (data: { gameId: string; gameCode: string }) => {
      setCreating(false);
      router.replace(`/host/${data.gameId}?code=${data.gameCode}`);
    };
    socket.on('game-created', onCreated);
    return () => {
      socket.off('game-created', onCreated);
    };
  }, [router]);

  const createGame = () => {
    setError(null);
    setCreating(true);
    getSocket().emit('create-game', { questions: SAMPLE_QUESTIONS });
  };

  return (
    <>
      <Head>
        <title>Host a game – Kahoot Clone</title>
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
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 24 }}>Host a game</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center' }}>
          Start with a sample quiz ({SAMPLE_QUESTIONS.length} questions). Share the game code with players.
        </p>
        {error && <p style={{ color: 'var(--accent)', marginBottom: 16 }}>{error}</p>}
        <button
          onClick={createGame}
          disabled={creating}
          style={{
            padding: '16px 40px',
            fontSize: 18,
            fontWeight: 700,
            borderRadius: var(--radius),
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: '#fff',
            boxShadow: var(--shadow),
            opacity: creating ? 0.7 : 1,
          }}
        >
          {creating ? 'Creating…' : 'Create game'}
        </button>
      </main>
    </>
  );
}
