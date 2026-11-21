'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onSessionExpired, refreshAccessToken, setAccessToken } from '@/lib/http/client';
import { authService } from '@/services';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// status: 'loading' (pehli baar session check) | 'authed' | 'guest'
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [status, setStatus] = useState('loading');
  const booted = useRef(false);

  // Logout/expiry par React Query cache bhi saaf: warna agla user purana data dekh sakta hai
  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setProfiles({});
    setStatus('guest');
    queryClient.clear();
  }, [queryClient]);

  // Login/OTP/Google/2FA ka response: { user, accessToken } ya { requires2FA, tempToken }
  const handleLoginResult = useCallback((res) => {
    const data = res.data;
    if (data.requires2FA) return { requires2FA: true, tempToken: data.tempToken };
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authed');
    authService
      .me()
      .then((r) => setProfiles(r.data.profiles || {}))
      .catch(() => {});
    return { requires2FA: false };
  }, []);

  // Page load / reload: httpOnly cookie se naya access token, phir /me
  useEffect(() => {
    if (booted.current) return; // StrictMode me double run se bachav
    booted.current = true;
    (async () => {
      try {
        await refreshAccessToken();
        const res = await authService.me();
        setUser(res.data.user);
        setProfiles(res.data.profiles || {});
        setStatus('authed');
      } catch {
        clear();
      }
    })();
  }, [clear]);

  // Kisi bhi request ke beech refresh fail ho jaye (session revoke/expire) to login par bhejo
  useEffect(() => onSessionExpired(clear), [clear]);

  const value = useMemo(
    () => ({
      user,
      profiles,
      status,
      loginPassword: async (identifier, password) => handleLoginResult(await authService.login(identifier, password)),
      requestOtp: (identifier) => authService.otpRequest(identifier),
      loginOtp: async (identifier, code) => handleLoginResult(await authService.otpLogin(identifier, code)),
      loginGoogle: async (idToken) => handleLoginResult(await authService.google(idToken)),
      loginTwoFactor: async (tempToken, code) => handleLoginResult(await authService.twoFactorLogin(tempToken, code)),
      applySession: handleLoginResult, // password change ke baad naya session
      refreshMe: async () => {
        const res = await authService.me();
        setUser(res.data.user);
        setProfiles(res.data.profiles || {});
      },
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          clear();
        }
      },
      logoutAll: async () => {
        try {
          await authService.logoutAll();
        } finally {
          clear();
        }
      },
    }),
    [user, profiles, status, handleLoginResult, clear]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
