# IoT System Manager Frontend

React single-page application built with Vite. The frontend provides public, authentication, user, and administrator pages and uses the backend HTTP API and SignalR for live device updates.

## Requirements

- Node.js and npm
- The IoT System Manager backend running and reachable

## Setup and development

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Set `VITE_BASE_URL` in a local `.env` file to the backend API base URL before running the app. The development setup uses `http://localhost:5239` for the backend and `http://localhost:5173` for the frontend so browser cookies work consistently across profiles. Update the API and SignalR hub URLs if the backend uses a different address.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local Vite development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
