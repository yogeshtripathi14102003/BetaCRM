'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// Server/hydration par false, browser me true (browser-only cheezein dikhane se pehle hydration mismatch na ho)
export const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

// OS check (shortcut label: ⌘ K vs Ctrl K)
export const useIsMac = () =>
  useSyncExternalStore(
    subscribe,
    () => /mac|iphone|ipad/i.test(navigator.userAgent),
    () => false
  );
