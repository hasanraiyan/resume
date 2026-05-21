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
  title: 'ReCall - Your External Memory',
  description: 'Throw in anything instantly. Retrieve it by thought.',
};

export default function RecallLayout({ children }) {
  return (
    <div
      className={`${pacifico.variable} ${nunito.variable} min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34]`}
    >
      {children}
    </div>
  );
}
