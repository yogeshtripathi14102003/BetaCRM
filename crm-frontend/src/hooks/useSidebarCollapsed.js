'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'crm.sidebar.collapsed';
const listeners = new Set();

const subscribe = (cb) => {
  listeners.add(cb);
  window.addEventListener('storage', cb); // doosre tab me badle to yahan bhi
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
};
const read = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false; // private mode
  }
};

// Desktop par sidebar icon-only; choice browser me yaad rehti hai
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, read() ? '0' : '1');
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }, []);
  return [collapsed, toggle];
}
