'use client';

import { BalanceBadge, useBalance } from '@/components/coursify/BalanceBadge';

export function BalanceBadgeServer() {
  const { balance, isLoading } = useBalance();
  return <BalanceBadge balance={balance} loading={isLoading} />;
}
