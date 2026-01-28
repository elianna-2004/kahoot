import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';

type Player = { id: string; name: string; score: number; socketId?: string };
type LeaderboardEntry = Player;

export default function HostGamePage() {
  const router = useRouter();
  const { gameId } = router.query;
  const [gameCode, setGameCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [question, setQuestion] = useState<{
    id: string;
    text: string;
    answers: string[];
    correctAnswer: number;
  } | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (typeof gameId !== 'string') return;
    const socket = getSocket();

    const onPlayerJoined = (data: { player: Player }) => {
      setPlayers((prev) => [
        ...prev.filter((p) => p.id !== data.player.id && p.socketId !== (data.player as { socketId?: string }).socketId),
        { ...data.player, score: 0 },
      ]);
    };

    const onGameStarted = (data: {
      question: typeof question;
      questionNumber: number;
      totalQuestions: number;
    }) => {
      setStatus('playing');
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setShowLeaderboard(false);
    };

    const onNextQuestion = (data: {
      question: typeof question;
      questionNumber: number;
      totalQuestions: number;
    }) => {
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setShowLeaderboard(false);
    };

    const onAllAnswered = (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setShowLeaderboard(true);
    };

    const onLeaderboardUpdate = (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
    };

    const onGameFinished = (data: { leaderboard: LeaderboardEntry[] }) => {
      setStatus('finished');
      setLeaderboard(data.leaderboard);
      setQuestion(null);
      setShowLeaderboard(true);
    };

    const onGameEnded = () => {
      setStatus('finished');
      router.replace('/host');
    };

    const onPlayerLeft = (data: { socketId: string }) => {
      setPlayers((prev) => prev.filter((p) => (p as Player & { socketId?: string }).socketId !== data.socketId));
    };

    socket.on('player-joined', onPlayerJoined);
    socket.on('game-started', onGameStarted);
    socket.on('next-question', onNextQuestion);
    socket.on('all-answered', onAllAnswered);
    socket.on('leaderboard-update', onLeaderboardUpdate);
    socket.on('game-finished', onGameFinished);
    socket.on('game-ended', onGameEnded);
    socket.on('player-left', onPlayerLeft);

    return () => {
      socket.off('player-joined', onPlayerJoined);
      socket.off('game-started', onGameStarted);
      socket.off('next-question', onNextQuestion);
      socket.off('all-answered', onAllAnswered);
      socket.off('leaderboard-update', onLeaderboardUpdate);
      socket.off('game-finished', onGameFinished);
      socket.off('game-ended', onGameEnded);
      socket.off('player-left', onPlayerLeft);
    };
  }, [gameId, router]);

  useEffect(() => {
    if (!router.isReady) return;
    const code = router.query.code;
    if (typeof code === 'string') setGameCode(code);
  }, [router.isReady, router.query.code]);

  if (!gameId || typeof gameId !== 'string') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading…</p>
      </main>
    );
  }

  const startGame = () => {
    getSocket().emit('start-game', { gameId });
  };

  const nextQuestion = () => {
    getSocket().emit('next-question', { gameId });
  };

  const emitShowLeaderboard = () => {
    getSocket().emit('show-leaderboard', { gameId });
    setShowLeaderboard(true);
  };

  if (!gameCode) {
    return (
      <>
        <Head><title>Host – Kahoot Clone</title></Head>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 16,
          }}
        >
          {router.isReady ? (
            <>
              <p>Invalid or expired game link.</p>
              <Link href="/host" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                Create a new game →
              </Link>
            </>
          ) : (
            <p>Loading game…</p>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Game {gameCode} – Kahoot Clone</title>
      </Head>
      <main
        style={{
          minHeight: '100vh',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Link href="/" style={{ position: 'absolute', top: 24, left: 24, color: 'var(--text-muted)' }}>
          ← Home
        </Link>

        {status === 'waiting' && (
          <>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Waiting for players</h1>
            <p
              style={{
                fontSize: '3rem',
                fontWeight: 800,
                letterSpacing: '0.3em',
                marginBottom: 32,
                color: 'var(--accent)',
                fontFamily: 'monospace',
              }}
            >
              {gameCode}
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Players join at your app URL and enter this code.
            </p>
            <ul
              style={{
                listStyle: 'none',
                width: '100%',
                maxWidth: 320,
                marginBottom: 32,
                background: 'var(--bg-card)',
                borderRadius: var(--radius),
                padding: 16,
                boxShadow: var(--shadow),
              }}
            >
              {players.length === 0 ? (
                <li style={{ color: 'var(--text-muted)', padding: 8 }}>No players yet</li>
              ) : (
                players.map((p) => (
                  <li
                    key={p.id}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'var(--green)',
                      }}
                    />
                    {p.name}
                  </li>
                ))
              )}
            </ul>
            <button
              onClick={startGame}
              disabled={players.length === 0}
              style={{
                padding: '16px 40px',
                fontSize: 18,
                fontWeight: 700,
                borderRadius: var(--radius),
                background: 'linear-gradient(135deg, var(--green), #16a34a)',
                color: '#fff',
                boxShadow: var(--shadow),
                opacity: players.length === 0 ? 0.5 : 1,
              }}
            >
              Start game
            </button>
          </>
        )}

        {status === 'playing' && question && (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Question {questionNumber} of {totalQuestions}
            </p>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: 24,
                textAlign: 'center',
                maxWidth: 600,
              }}
            >
              {question.text}
            </h2>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {question.answers.map((a, i) => (
                <span
                  key={i}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {['🔴', '🔵', '🟡', '🟢'][i]} {a}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={emitShowLeaderboard}
                style={{
                  padding: '12px 24px',
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: var(--radius),
                  background: 'var(--bg-card)',
                  color: '#fff',
                  border: '2px solid var(--accent)',
                }}
              >
                Show leaderboard
              </button>
              <button
                onClick={nextQuestion}
                style={{
                  padding: '12px 24px',
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: var(--radius),
                  background: 'linear-gradient(135deg, var(--purple), #8b5cf6)',
                  color: '#fff',
                }}
              >
                Next question
              </button>
            </div>
            {showLeaderboard && (
              <div
                style={{
                  marginTop: 32,
                  width: '100%',
                  maxWidth: 400,
                  background: 'var(--bg-card)',
                  borderRadius: var(--radius),
                  padding: 20,
                  boxShadow: var(--shadow),
                }}
              >
                <h3 style={{ marginBottom: 16, fontSize: 1.25 }}>Leaderboard</h3>
                <ol style={{ listStyle: 'decimal', paddingLeft: 24 }}>
                  {leaderboard.slice(0, 10).map((p, i) => (
                    <li key={p.id} style={{ padding: '6px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{p.name}</span>
                      <strong>{p.score} pts</strong>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {status === 'finished' && (
          <>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 24 }}>Game over</h1>
            <div
              style={{
                width: '100%',
                maxWidth: 420,
                background: 'var(--bg-card)',
                borderRadius: var(--radius),
                padding: 24,
                boxShadow: var(--shadow),
              }}
            >
              <h3 style={{ marginBottom: 16, fontSize: '1.25rem' }}>Final leaderboard</h3>
              <ol style={{ listStyle: 'decimal', paddingLeft: 24 }}>
                {leaderboard.map((p, i) => (
                  <li
                    key={p.id}
                    style={{
                      padding: '10px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}
                  >
                    <span>
                      {i === 0 && '🏆 '}
                      {p.name}
                    </span>
                    <strong>{p.score} pts</strong>
                  </li>
                ))}
              </ol>
            </div>
            <Link href="/host" style={{ marginTop: 24, color: 'var(--accent)', fontWeight: 700 }}>
              Host another game →
            </Link>
          </>
        )}
      </main>
    </>
  );
}
