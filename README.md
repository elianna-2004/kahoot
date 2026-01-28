# Kahoot Clone

A multiplayer Kahoot-style quiz game built with **Next.js** and **Socket.IO**, deployable on **Railway**.

## Features

- **Host a game**: Create a game and get a 6-character PIN. Share the PIN and app URL so players can join.
- **Join with PIN**: Players enter the game code and a nickname, then wait in the lobby.
- **Live quiz**: Host starts the game; questions appear for everyone. Players tap colored answer tiles (Kahoot-style).
- **Leaderboard**: After each question (or when everyone has answered), the host can show the leaderboard. At the end, a final ranking is shown.

## Tech stack

- **Next.js 14** (Pages Router) – frontend and SSR
- **Socket.IO** – real-time game state (lobby, questions, answers, leaderboard)
- **Custom Node server** – runs both Next and the Socket.IO server

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use one tab/browser as host, another (or a different device) as player.

## Push to GitHub

1. [Create a new repo](https://github.com/new) on GitHub (e.g. `kahoot-clone`). Leave it empty—no README, .gitignore, or license.
2. In this project folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Kahoot clone"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/kahoot-clone.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME/kahoot-clone` with your GitHub username and repo name. Use the SSH URL (`git@github.com:YOUR_USERNAME/kahoot-clone.git`) if you use SSH keys.

## Deploy on Railway

1. Use the GitHub repo you created above (or connect another source).
2. In [Railway](https://railway.com), create a new project and deploy from this repo.
3. Build and start are configured in `railway.json`:
   - **Build**: `npm run build`
   - **Start**: `npm start` (runs the custom server that serves Next + Socket.IO)
4. Railway sets `PORT`; the server uses it automatically.
5. Generate a public URL in the service settings so players can open the app.

## Project structure

- `pages/` – Next.js routes (home, host, play)
- `server.js` – Custom HTTP server + Socket.IO + Next handler
- `lib/socket.ts` – Socket.IO client helper
- `lib/sampleQuiz.ts` – Default quiz used when hosting

## Run tests

E2E tests use [Playwright](https://playwright.dev) and cover player join and gameplay:

```bash
npm install
npx playwright install chromium   # first time: install browser
npm run test:e2e
```

Tests start the dev server, then:

- **player-join.spec.ts**: Host creates a game → player joins with PIN → player sees “You’re in!” and host sees them in the lobby; wrong PIN shows an error.
- **gameplay.spec.ts**: Host starts the game → player sees Q1 and answers → host sees leaderboard; full run-through to game over and final leaderboard.

## How to play

1. **Host**: Click “Host a game” → “Create game” → copy the **game code** (e.g. `ABC123`). Share the app URL and code with players.
2. **Players**: Click “Join a game” → enter the code and name → “Join”.
3. **Host**: When everyone is in, click “Start game”.
4. **Everyone**: Answer each question by tapping one of the four colored options.
5. **Host**: Use “Show leaderboard” and “Next question” to move through the quiz. At the last question, “Next question” ends the game and shows the final leaderboard.
