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
  title: 'Vaultly - Storage Drive',
  description: 'Manage multiple storage configurations and files.',
};

export default function VaultlyLayout({ children }) {
  return (
    <div
      className={`min-h-screen bg-[#fcfbf5] dark:bg-[#1e1e1e] ${pacifico.variable} ${nunito.variable} font-sans`}
    >
      {children}
    </div>
  );
}
