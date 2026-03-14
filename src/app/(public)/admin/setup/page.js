import AdminSetupClient from './AdminSetupClient';
import { hasAdminUser } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Setup | Hasan Raiyan',
  description: 'Initial setup for the platform administrator.',
};

export default async function AdminSetupPage() {
  const adminExists = await hasAdminUser();
  if (adminExists) {
    redirect('/admin/login');
  }

  return <AdminSetupClient />;
}
