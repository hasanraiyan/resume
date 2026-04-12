import VaultlyContent from '@/components/vaultly/VaultlyContent';
import SessionProvider from '@/components/SessionProvider';

export default function VaultlyApp() {
    return (
        <SessionProvider>
            <VaultlyContent />
        </SessionProvider>
    );
}
