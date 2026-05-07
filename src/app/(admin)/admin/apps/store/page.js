import AppStoreClient from './AppStoreClient';

export const metadata = {
  title: 'App Store | Admin',
  description: 'Browse and launch mini apps like SnapLinks and Pocketly.',
};

export default function AdminAppStorePage() {
  return <AppStoreClient />;
}
