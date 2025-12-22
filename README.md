# Clueso Clone – Frontend (Next.js App Router + Tailwind)

## Overview

This repository contains the **frontend** for a partial but coherent clone of [Clueso.io](https://www.clueso.io), focusing on the workflow where a browser extension turns product flows into AI‑powered sessions and documentation.[web:22][web:29]  
It is built with the Next.js **App Router**, TypeScript, Tailwind CSS, and Zustand for auth state.

The frontend talks only to the Node backend at `http://localhost:4000/api/v1` and provides:

- Auth pages (signup + login) using email/password + JWT
- A sessions dashboard that lists sessions created automatically from the Chrome extension
- A session detail view with AI script, extension events, and feedback
- A bridge component that shares the JWT with the Chrome extension

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
- `/sessions` shows a list of sessions that are **created by the Chrome extension**, not by a manual form.
- `/sessions/[id]` shows details for a single session, including AI script, feedback, and extension events.
- A client-only `AuthExtensionBridge` component posts the JWT to `window`, and the content script copies it into `chrome.storage.local` so the extension can call backend APIs.

### Folder structure (simplified)

app/
layout.tsx # Root layout
page.tsx # Landing / redirect page
login/page.tsx # Login form
signup/page.tsx # Signup form
sessions/page.tsx # Sessions dashboard (list)
sessions/[id]/page.tsx # Session detail view

components/
AppHeader.tsx # Top header with title + user + logout
AuthExtensionBridge.tsx # Sends JWT to window for the extension

lib/
api.ts # API helpers (auth, sessions, feedback)
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

export const API_BASE_URL =
process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

function authHeaders(token?: string) {
return token ? { Authorization: Bearer ${token} } : {};
}

text

### Types

- `Session`:
  - `id`, `name`, `status`, `scriptText`, `audioFileName`
  - `createdAt`, `updatedAt`
  - optional `userId`
- `Feedback`:
  - `id`, `sessionId`, `text`, `createdAt`, `updatedAt`
- `ExtensionEvent` (used mainly in the backend and detail page):
  - `id`, `sessionId`, `url`, `steps`, `createdAt`, `updatedAt`

### Auth helpers

- `signup(email, password)` → `POST /v1/auth/signup` → `{ user, token }`
- `login(email, password)` → `POST /v1/auth/login` → `{ user, token }`

### Session helpers (pass `token`)

- `listSessions(token?)` → `GET /v1/sessions`
- `processSession(id, token?)` → `POST /v1/sessions/:id/process`  
  Returns an updated `session` object after AI processing.

> Note: there is **no** `createSession` call from the frontend anymore.  
> Sessions are created by the Chrome extension via `POST /api/v1/sessions/from-extension` on the backend.

### Feedback helpers

- `addFeedback(sessionId, text, token?)` → `POST /v1/sessions/:id/feedback`
- `listFeedbacks(sessionId, token?)` → `GET /v1/sessions/:id/feedback`

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

- Stored in `localStorage` so refresh persists login.
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

### `/sessions` (Sessions dashboard)

- Reads `token` from the auth store.
- On mount:
  - Calls `listSessions(token)` and stores the array in local state.
- UI:
  - **Info card** explaining that sessions are created automatically by the Chrome extension while the user is logged in.
  - **Sessions list**:
    - For each session:
      - Name (links to `/sessions/[id]`).
      - Created date.
      - Status pill (`PENDING` / `PROCESSING` / `READY` / `FAILED`).
      - “Process with AI” button → calls `processSession(id, token)` and updates only that card’s state.
      - Optional inline snippet of `scriptText`.
  - **Feedback section per session**:
    - Button to load feedback via `listFeedbacks`.
    - Textarea + Save button to call `addFeedback`.

There is **no manual “Create session” form**.  
Sessions appear when the user uses the Chrome extension’s **Start Recording** button on any page while logged in.

### `/sessions/[id]` (Session detail)

- Reads `token` from auth store.
- Loads the specific session via `GET /v1/sessions/:id` from the backend (which already includes AI fields and related data).
- UI sections:
  - **Header**:
    - Session name, created date, status pill.
    - “Process with AI” button for that session.
  - **AI Script**:
    - Shows `scriptText` if available, or a placeholder when status is not `READY`.
  - **Extension events**:
    - Shows events stored by the backend for this session (URL + steps).
  - **Feedback**:
    - Textarea + Save button to call `addFeedback`.
    - List of existing feedback entries.

---

## Extension Bridge

A small client-only component `AuthExtensionBridge` runs on authenticated pages (e.g. `/sessions` and `/sessions/[id]`):

- Reads `token` from the auth store.
- In `useEffect`, posts the JWT to the window:

window.postMessage({ jwt: token }, window.location.origin);

text

- The Chrome extension **content script** listens for this message and writes the JWT into `chrome.storage.local`.

This allows the extension to call backend APIs with `Authorization: Bearer <token>` using the same JWT as the web app.

---

## Styling & Layout

- Tailwind CSS is configured via `tailwind.config.*` and `postcss.config.*`.[web:23]
- `app/layout.tsx` sets up the root HTML structure and imports `globals.css`.
- The sessions pages use a dark SaaS-style layout inspired by Clueso:
  - Left-aligned column of session cards.
  - Clear status pills and call‑to‑action buttons.
  - Sections labeled “AI Script”, “Extension Events”, and “Feedback”.

---

## Environment Variables

The frontend primarily needs the backend URL:

NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

text

Create a `.env.local` file in the frontend repo with that line.  
When deployed (e.g. to Vercel), update it to point to the hosted backend URL.

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

The app will be available at `http://localhost:3000`.

---

## End‑to‑End Flow with Extension

1. Start the **backend** on `http://localhost:4000`.
2. Load the **Chrome extension** (from the extension repo) in Developer Mode.
3. Visit `http://localhost:3000/signup` to create a user and then `http://localhost:3000/login` to log in.
4. Navigate to `/sessions`. The `AuthExtensionBridge` will send your JWT to the extension.
5. Open any page you want to “record” (can be any URL).
6. Click the extension icon → popup → **Start Recording**.
7. The extension calls `POST /api/v1/sessions/from-extension` on the backend, which:
   - Creates a new `Session` for the current user.
   - Creates the first `ExtensionEvent` with `{ url, steps }`.
   - Opens `/sessions/<id>` in a new tab.
8. On the session detail page, click **Process with AI** to trigger `POST /api/v1/sessions/:id/process`, which currently uses the Node mock AI and can later be wired to the Python FastAPI service.

---

## Limitations & Future Work

- The UI focuses on the core assignment flows and is not a pixel-perfect clone of Clueso’s marketing site or studio editor.[web:23]
- In real Clueso, recording and AI processing are tightly coupled: as the user records, Clueso streams data through a pipeline that turns raw captures into polished videos, scripts, and articles.[web:22][web:31]
- In this clone:
  - The Chrome extension creates **sessions + initial events** from the active tab when the user clicks **Start Recording**.
  - The user explicitly clicks **Process with AI** to run AI processing for a given session.
  - The AI layer is currently a mock implementation in Node; the endpoint is designed so a Python FastAPI service can be plugged in later without frontend changes.
- Error handling, pagination, and advanced UI polish (toasts, loaders, retries) are intentionally minimal to keep the focus on end‑to‑end architecture and the extension → backend → AI → frontend loop.