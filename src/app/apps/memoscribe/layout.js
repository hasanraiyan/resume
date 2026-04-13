import { Pacifico, Nunito } from 'next/font/google';

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

export const metadata = {
  title: 'Memo Scribe',
  description: 'AI-powered note saving and retrieval app',
};

export default function AppLayout({ children }) {
  return <div className={`${pacifico.variable} ${nunito.variable} h-full`}>{children}</div>;
}
