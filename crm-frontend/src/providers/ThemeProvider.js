'use client';

import { ThemeProvider as NextThemes } from 'next-themes';

// class="dark" <html> par lagta hai; default = system (OS ki setting)
export default function ThemeProvider({ children }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
