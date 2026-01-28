import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';

type LeaderboardEntry = { id: string; name: string; score: number };

const ANSWER_CLASSES = ['answer-red', 'answer-blue', 'answer-yellow', 'answer-green'];
const ANSWER_ICONS = ['🔴', '🔵', '🟡', '🟢'];

export default function PlayerGamePage() {
  const router = useRouter();
  const { gameId } = router.query;
  const [screen, setScreen] = useState<'waiting' | 'question' | 'feedback' | 'leaderboard' | 'finished'>('waiting');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [question, setQuestion] = useState<{
    id: string;
    text: string;
    answers: string[];
    correctAnswer: number;
  } | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('playerId');
      const storedGame = sessionStorage.getItem('gameId');
      if (stored && storedGame === gameId) setPlayerId(stored);
    }
  }, [gameId]);

  useEffect(() => {
    if (typeof gameId !== 'string' || !playerId) return;
    const socket = getSocket();

    const onGameStarted = (data: {
      question: typeof question;
      questionNumber: number;
      totalQuestions: number;
    }) => {
      setScreen('question');
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    };

    const onNextQuestion = (data: {
      question: typeof question;
      questionNumber: number;
      totalQuestions: number;
    }) => {
      setScreen('question');
      setQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    };

    const onAnswerReceived = (data: { isCorrect: boolean }) => {
      setAnswerFeedback(data.isCorrect ? 'correct' : 'wrong');
      setScreen('feedback');
    };

    const onAllAnswered = (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setScreen('leaderboard');
    };

    const onLeaderboardUpdate = (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setScreen('leaderboard');
    };

    const onGameFinished = (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setScreen('finished');
    };

    const onGameEnded = () => {
      setScreen('finished');
      setLeaderboard([]);
    };

    socket.on('game-started', onGameStarted);
    socket.on('next-question', onNextQuestion);
    socket.on('answer-received', onAnswerReceived);
    socket.on('all-answered', onAllAnswered);
    socket.on('leaderboard-update', onLeaderboardUpdate);
    socket.on('game-finished', onGameFinished);
    socket.on('game-ended', onGameEnded);

    return () => {
      socket.off('game-started', onGameStarted);
      socket.off('next-question', onNextQuestion);
      socket.off('answer-received', onAnswerReceived);
      socket.off('all-answered', onAllAnswered);
      socket.off('leaderboard-update', onLeaderboardUpdate);
      socket.off('game-finished', onGameFinished);
      socket.off('game-ended', onGameEnded);
    };
  }, [gameId, playerId]);

  const submitAnswer = (answerIndex: number) => {
    if (!question || !playerId || typeof gameId !== 'string' || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);
    getSocket().emit('submit-answer', {
      gameId,
      playerId,
      questionId: question.id,
      answerIndex,
    });
  };

  if (!gameId || typeof gameId !== 'string') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (!playerId) {
    return (
      <>
        <Head><title>Join – Kahoot Clone</title></Head>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <p style={{ marginBottom: 16 }}>Invalid session. Please join from the join page.</p>
          <Link href="/play" style={{ color: 'var(--accent)', fontWeight: 700 }}>Join with game code →</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Playing – Kahoot Clone</title>
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
        {screen === 'waiting' && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 16 }}>You're in!</h1>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              Waiting for the host to start the game. Keep this tab open.
            </p>
          </>
        )}

        {(screen === 'question' || screen === 'feedback') && question && (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Question {questionNumber} of {totalQuestions}
            </p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 24, textAlign: 'center', maxWidth: 560 }}>
              {question.text}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                width: '100%',
                maxWidth: 560,
              }}
            >
              {question.answers.map((a, i) => {
                const chosen = selectedAnswer === i;
                const disabled = selectedAnswer !== null;
                const correct = screen === 'feedback' && question.correctAnswer === i;
                const wrong = screen === 'feedback' && chosen && answerFeedback === 'wrong';
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => submitAnswer(i)}
                    className={ANSWER_CLASSES[i]}
                    style={{
                      padding: '20px 16px',
                      fontSize: 16,
                      fontWeight: 700,
                      borderRadius: var(--radius),
                      color: '#fff',
                      textAlign: 'left',
                      boxShadow: var(--shadow),
                      border: chosen ? '4px solid #fff' : '4px solid transparent',
                      opacity: disabled && !chosen && !correct ? 0.5 : 1,
                      transition: 'transform 0.15s, filter 0.15s',
                    }}
                  >
                    <span style={{ marginRight: 8 }}>{ANSWER_ICONS[i]}</span>
                    {a}
                    {correct && ' ✓'}
                    {wrong && ' ✗'}
                  </button>
                );
              })}
            </div>
            {screen === 'feedback' && (
              <p
                style={{
                  marginTop: 24,
                  fontSize: 18,
                  fontWeight: 700,
                  color: answerFeedback === 'correct' ? 'var(--green)' : 'var(--red)',
                }}
              >
                {answerFeedback === 'correct' ? 'Correct!' : 'Wrong!'}
              </p>
            )}
          </>
        )}

        {(screen === 'leaderboard' || screen === 'finished') && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>
              {screen === 'finished' ? 'Game over' : 'Leaderboard'}
            </h1>
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                background: 'var(--bg-card)',
                borderRadius: var(--radius),
                padding: 24,
                boxShadow: var(--shadow),
              }}
            >
              <ol style={{ listStyle: 'decimal', paddingLeft: 24 }}>
                {leaderboard.map((p, i) => (
                  <li
                    key={p.id}
                    style={{
                      padding: '10px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom:
                        i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
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
            {screen === 'finished' && (
              <Link href="/play" style={{ marginTop: 24, color: 'var(--accent)', fontWeight: 700 }}>
                Join another game →
              </Link>
            )}
          </>
        )}
      </main>
    </>
  );
}
