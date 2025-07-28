
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { connected, publicKey } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg solana-gradient flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Solana Escrow Hub</h1>
              <p className="text-xs text-muted-foreground">Secure token exchanges</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {connected && publicKey && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-accent/10">
                <Wallet className="w-4 h-4 text-accent" />
                <span className="text-sm font-mono">
                  {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
              </div>
            )}
            <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !rounded-lg !h-10" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
