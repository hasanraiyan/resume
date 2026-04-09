import AppStoreClient from './AppStoreClient';

export const metadata = {
  title: 'App Store | Admin',
  description: 'Browse and launch mini apps like SnapLinks, Pocketly, and Taskly.',
};

export default function AdminAppStorePage() {
  return <AppStoreClient />;
}
