'use client';

import { Pacifico, Nunito } from 'next/font/google';
import SessionProvider from '@/components/SessionProvider';
import { CoursifyProvider } from '@/context/CoursifyContext';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export default function CoursifyRootLayout({ children }) {
  return (
    <SessionProvider>
      <CoursifyProvider>
        <div
          className={`${pacifico.variable} ${nunito.variable} min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34]`}
        >
          {children}
        </div>
      </CoursifyProvider>
    </SessionProvider>
  );
}
