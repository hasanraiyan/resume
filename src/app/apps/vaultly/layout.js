import React from 'react';

export const metadata = {
  title: 'Vaultly - Storage Drive',
  description: 'Manage multiple storage configurations and files.',
};

export default function VaultlyLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  );
}
