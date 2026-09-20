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
  title: 'ProjectTime — Project & Time Tracking System',
  description:
    'Track project time, manage tasks, compare estimates vs actuals, and generate timesheets and reports.',
};

export default function ProjectTimeLayout({ children }) {
  return <div className={`${pacifico.variable} ${nunito.variable}`}>{children}</div>;
}
