'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { sendJwtToExtension } from '@/lib/extension-bridge';

export function AuthExtensionBridge() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    sendJwtToExtension(token);
  }, [token]);

  return null;
}
