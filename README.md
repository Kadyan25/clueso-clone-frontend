# Clueso Clone – Frontend (Next.js App Router + Tailwind)

## Overview

This repository contains the **frontend** for a partial but coherent clone of [Clueso.io](https://www.clueso.io). It is built with the Next.js **App Router**, TypeScript, Tailwind CSS, and Zustand for auth state. [web:105]

The frontend talks only to the Node backend at `http://localhost:4000/api/v1` and provides:

- Auth pages (signup + login) using email/password + JWT
- A sessions dashboard
- A session detail view with AI script, extension events, and feedback
- A small bridge component to share the JWT with the Chrome extension

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand (persistent auth store)
- **API:** REST calls to the Node backend

---

## Architecture

### High-level flow

- User signs up or logs in from the frontend → backend returns `{ user, token }`.
- JWT is stored in a persisted Zustand store.
- All API calls use `Authorization: Bearer <token>` headers.
- `/sessions` and `/sessions/[id]` pages call the backend to manage sessions, feedback, and extension events.
- A client-only bridge component posts the JWT to `window` so the Chrome extension content script can copy it into `chrome.storage.local`.

### Folder structure (simplified)

app/
layout.tsx # Root layout
page.tsx # Landing or redirect page
login/
page.tsx # Login form
signup/
page.tsx # Signup form
sessions/
page.tsx # Sessions dashboard
[id]/
page.tsx # Session detail view

components/
AppHeader.tsx # Top header with title + user + logout
SessionCard.tsx # Card used on /sessions (optional)
AuthExtensionBridge.tsx # Sends JWT to window for the extension

lib/
api.ts # All API helpers (auth, sessions, feedback, extension events)
auth-store.ts # Zustand store for user + token

styles/
globals.css # Tailwind base styles

tailwind.config.* # Tailwind configuration
postcss.config.* # PostCSS configuration
next.config.* # Next.js configuration

text

---

## API Helper (`lib/api.ts`)

The frontend uses a single API helper module that talks to the backend.

const API_BASE_URL =
process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

function authHeaders(token?: string) {
return token ? { Authorization: Bearer ${token} } : {};
}

text

### Types

- `Session`:
  - `id`, `name`, `status`, `scriptText`, `audioFileName`
  - `createdAt`, `updatedAt`
  - optional `userId`, `feedbacks`
- `Feedback`:
  - `id`, `sessionId`, `text`, `createdAt`, `updatedAt`
- `ExtensionEvent`:
  - `id`, `sessionId`, `url`, `steps`, `createdAt`, `updatedAt`

### Auth helpers

- `signup(email, password)` → `POST /v1/auth/signup` → `{ user, token }`
- `login(email, password)` → `POST /v1/auth/login` → `{ user, token }`

### Session helpers (pass `token`)

- `createSession(name, token?)` → `POST /v1/sessions`
- `listSessions(token?)` → `GET /v1/sessions`
- `processSession(id, token?)` → `POST /v1/sessions/:id/process` (returns updated `session`)

### Feedback helpers

- `addFeedback(sessionId, text, token?)` → `POST /v1/sessions/:id/feedback`
- `listFeedbacks(sessionId, token?)` → `GET /v1/sessions/:id/feedback`

### Extension event helpers

- `listExtensionEvents(sessionId, token?)` → `GET /v1/sessions/:id/extension-events`

---

## Auth State (`lib/auth-store.ts`)

The frontend uses a persisted Zustand store:

type AuthUser = { id: number; email: string; createdAt?: string };

type AuthState = {
token: string | null;
user: AuthUser | null;
setAuth: (token: string, user: AuthUser) => void;
logout: () => void;
};

text

- Stored in localStorage so refresh persists login.
- Used by pages/components to:
  - Redirect to `/login` if there is no `token`.
  - Pass `token` into API helpers.
  - Show the logged-in email and logout button in `AppHeader`.

---

## Pages

### `/login`

- Simple form with `email` and `password`.
- On submit:
  - Calls `login(email, password)`.
  - On success, calls `setAuth(token, user)` in the auth store.
  - Redirects to `/sessions`.

### `/signup`

- Form with `email` and `password`.
- On submit:
  - Calls `signup(email, password)`.
  - Either directly sets auth and redirects to `/sessions`, or redirects to `/login` depending on the chosen flow.

### `/sessions`

Sessions dashboard page:

- Reads `token` from the auth store.
- On mount:
  - Calls `listSessions(token)` and stores them in local state.
- UI:
  - **New session card**:
    - Input for session name.
    - Button to call `createSession(name, token)` and refresh list.
  - **Sessions list**:
    - For each session:
      - Name (links to `/sessions/[id]`)
      - Created date
      - Status pill (PENDING / PROCESSING / READY / FAILED)
      - “Process with AI” button → calls `processSession(id, token)` and updates the card.
      - Optional inline snippet of `scriptText`.
  - **Feedback section per session** (optional):
    - Button to load feedback.
    - Textarea + Save button to call `addFeedback`.

### `/sessions/[id]`

Session detail page:

- Reads `token` from auth store.
- Loads:
  - All sessions via `listSessions(token)` and finds the current one by `id`.
  - Feedback via `listFeedbacks(id, token)`.
  - Extension events via `listExtensionEvents(id, token)`.
- UI sections:
  - **Header**:
    - Session name, created date, status pill.
    - “Process with AI” button.
  - **AI Script**:
    - Shows `scriptText` if available, or a placeholder when status is not READY.
  - **Extension events**:
    - Instructions: open this page and click the Chrome extension to send events.
    - List of events with URL, timestamp, and steps array.
  - **Feedback**:
    - Textarea + Save button to call `addFeedback`.
    - List of existing feedback entries.

---

## Extension Bridge

A small client-only component (e.g. `AuthExtensionBridge`) runs on every authenticated page:

- Reads `token` from the auth store.
- In `useEffect`, calls a helper like `sendJwtToExtension(token)` that does:

window.postMessage({ jwt: token }, window.location.origin);

text

- The Chrome extension **content script** listens for this message and writes the JWT into `chrome.storage.local`.

This is how the extension later calls backend APIs with `Authorization: Bearer <token>`.

---

## Styling & Layout

- Tailwind CSS is configured via `tailwind.config.*` and `postcss.config.*`. [web:123]
- `app/layout.tsx` sets up the root HTML structure and imports `globals.css`.
- The sessions pages use a dark SaaS-style layout inspired by Clueso:
  - Left-aligned column of session cards
  - Clear status pills and buttons
  - Sections labeled “AI Script”, “Extension Events”, and “Feedback”

---

## Environment Variables

The frontend primarily needs the backend URL:

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

text

Create a `.env.local` file in the frontend repo with:

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

text

When deployed (e.g. to Vercel), this can be updated to point to the hosted backend URL. [web:104]

---

## Running Locally

1. **Clone the repo**

git clone https://github.com/Kadyan25/clueso-clone-frontend.git
cd clueso-clone-frontend

text

2. **Install dependencies**

npm install

text

3. **Create `.env.local`**

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

text

4. **Start the dev server**

npm run dev

text

The app will be available at:

http://localhost:3000

text

5. **Typical flow**

- Ensure the backend is running on `http://localhost:4000`.  
- Visit `http://localhost:3000/signup` to create a user.  
- Log in at `/login`, then go to `/sessions` to create and process sessions.  
- Open a session detail page (e.g. `/sessions/1`), then click the Chrome extension icon to send extension events into that session.

---

## Limitations & Future Work

- The UI focuses on the core assignment flows and is not a pixel-perfect copy of Clueso.  
- No advanced error handling, toasts, or skeleton loaders yet.  
- AI content is based on the backend’s mock implementation; when a real Python AI service is added, only the backend contract should change.
