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
  title: 'Pocketly - Finance Tracker',
  description: 'Personal finance and expense tracker',
};

export default function FinanceLayout({ children }) {
  return <div className={`${pacifico.variable} ${nunito.variable}`}>{children}</div>;
}
