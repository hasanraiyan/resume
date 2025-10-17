// src/app/meet/page.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import LobbyClient from '@/components/meet/LobbyClient'; // We'll create this next

export default async function MeetLobbyPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';

  return (
    <>
      <CustomCursor />
      <Navbar />
      <main className="min-h-screen flex items-center justify-center pt-20 sm:pt-24">
        <LobbyClient isAdmin={isAdmin} />
      </main>
      <Footer />
    </>
  );
}
