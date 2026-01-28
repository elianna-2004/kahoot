import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Kahoot Clone – Play Quiz Together</title>
      </Head>
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: 800,
            marginBottom: 8,
            background: 'linear-gradient(90deg, #fff, #e94560)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Kahoot Clone
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 48, fontSize: 18 }}>
          Create or join a live quiz game
        </p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/host">
            <button
              style={{
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                color: '#fff',
                boxShadow: 'var(--shadow)',
              }}
            >
              Host a game
            </button>
          </Link>
          <Link href="/play">
            <button
              style={{
                padding: '16px 32px',
                fontSize: 18,
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                background: 'var(--bg-card)',
                color: '#fff',
                border: '2px solid var(--accent)',
                boxShadow: 'var(--shadow)',
              }}
            >
              Join a game
            </button>
          </Link>
        </div>
      </main>
    </>
  );
}
