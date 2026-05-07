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
  title: 'Journaly — Personal AI Journal',
  description: 'Private personal journal with AI-powered semantic search and recall.',
};

export default function JournalyLayout({ children }) {
  return (
    <div className={`${pacifico.variable} ${nunito.variable} font-sans`}>
      {children}
    </div>
  );
}
