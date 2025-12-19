// lib/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

function authHeaders(token?: string) {
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export interface Feedback {
  id: number;
  sessionId: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: number;
  name: string;
  status: string;
  scriptText: string | null;
  audioFileName: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  feedbacks?: Feedback[];
}

export type ExtensionEvent = {
  id: number;
  sessionId: number;
  url: string;
  steps: any[];
  createdAt: string;
  updatedAt: string;
};

// AUTH

export async function signup(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error('Failed to sign up');
  }
  return res.json() as Promise<{ user: { id: number; email: string }; token: string }>;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error('Failed to log in');
  }
  return res.json() as Promise<{ user: { id: number; email: string }; token: string }>;
}

// EXTENSION EVENTS

export async function listExtensionEvents(
  sessionId: number,
  token?: string,
): Promise<ExtensionEvent[]> {
  const res = await fetch(
    `${API_BASE_URL}/v1/sessions/${sessionId}/extension-events`,
    {
      headers: {
        ...authHeaders(token),
      },
    },
  );
  if (!res.ok) {
    throw new Error('Failed to fetch extension events');
  }
  return res.json();
}

// SESSIONS

export async function createSession(name: string, token?: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    throw new Error('Failed to create session');
  }

  return res.json();
}

export async function listSessions(token?: string): Promise<Session[]> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions`, {
    headers: {
      ...authHeaders(token),
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch sessions');
  }

  return res.json();
}

export async function processSession(id: number, token?: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions/${id}/process`, {
    method: 'POST',
    headers: {
      ...authHeaders(token),
    },
  });

  if (!res.ok) {
    throw new Error('Failed to process session');
  }

  const data = await res.json();
  return data.session;
}

// FEEDBACK

export async function addFeedback(
  sessionId: number,
  text: string,
  token?: string,
): Promise<Feedback> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions/${sessionId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error('Failed to create feedback');
  }

  return res.json();
}

export async function listFeedbacks(
  sessionId: number,
  token?: string,
): Promise<Feedback[]> {
  const res = await fetch(
    `${API_BASE_URL}/v1/sessions/${sessionId}/feedback`,
    {
      headers: {
        ...authHeaders(token),
      },
    },
  );
  if (!res.ok) {
    throw new Error('Failed to fetch feedbacks');
  }
  return res.json();
}
