import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { Settings, Trash2, Clock, ArrowRightLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEscrow } from '@/hooks/useEscrow';

const MyEscrows = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const { userEscrows, cancelEscrow, loading } = useEscrow();

  const formatTimeRemaining = (expiresAtBigInt: bigint) => {
    const expiresAt = new Date(Number(expiresAtBigInt));
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const formatAmount = (amount: bigint) => {
    // Convert from smallest unit to display unit (assuming 9 decimals for most tokens)
    return (Number(amount) / 1e9).toFixed(4);
  };

  const getTokenSymbol = (tokenMint: string) => {
    // Mock token symbols based on mint addresses
    const tokenMap: { [key: string]: string } = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
    };
    return tokenMap[tokenMint] || 'Unknown';
  };

  const getTokenLogo = (tokenMint: string) => {
    const logoMap: { [key: string]: string } = {
      'So11111111111111111111111111111111111111112': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    };
    return logoMap[tokenMint] || `https://ui-avatars.com/api/?name=${getTokenSymbol(tokenMint)}&background=8b5cf6&color=fff&size=40`;
  };

  const handleCancelEscrow = async (escrowAccount: any) => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      await cancelEscrow(escrowAccount.escrowPda, escrowAccount);
    } catch (error) {
      console.error('Error canceling escrow:', error);
    }
  };

  const handleUpdateEscrow = (escrowId: string) => {
    toast({
      title: "Update feature coming soon!",
      description: "Escrow update functionality will be available in the next version",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'taken':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Connect your wallet</h3>
          <p>Connect your wallet to view your escrows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Escrows</h2>
        <Badge variant="outline" className="px-3 py-1">
          {userEscrows.length} Total
        </Badge>
      </div>

      <div className="grid gap-4">
        {userEscrows.map((escrow, index) => (
          <Card key={escrow.escrowPda.toString()} className="glass-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={getTokenLogo(escrow.tokenA.toString())} 
                      alt={getTokenSymbol(escrow.tokenA.toString())}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${getTokenSymbol(escrow.tokenA.toString())}&background=8b5cf6&color=fff&size=40`;
                      }}
                    />
                    <div>
                      <div className="font-semibold text-lg">{formatAmount(escrow.amountA)}</div>
                      <div className="text-muted-foreground text-sm">{getTokenSymbol(escrow.tokenA.toString())}</div>
                    </div>
                  </div>

                  <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />

                  <div className="flex items-center space-x-3">
                    <img 
                      src={getTokenLogo(escrow.tokenB.toString())} 
                      alt={getTokenSymbol(escrow.tokenB.toString())}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${getTokenSymbol(escrow.tokenB.toString())}&background=14b8a6&color=fff&size=40`;
                      }}
                    />
                    <div>
                      <div className="font-semibold text-lg">{formatAmount(escrow.amountB)}</div>
                      <div className="text-muted-foreground text-sm">{getTokenSymbol(escrow.tokenB.toString())}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end space-x-4">
                  <div className="flex items-center space-x-4 text-sm">
                    {getStatusBadge(escrow.status)}
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeRemaining(escrow.expiresAt)}</span>
                    </div>
                    {escrow.isMutable && (
                      <Badge variant="secondary" className="text-xs">
                        Mutable
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {escrow.status === 'active' && escrow.isMutable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateEscrow(escrow.escrowPda.toString())}
                        disabled={loading}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                    {escrow.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelEscrow(escrow)}
                        disabled={loading}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {userEscrows.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No escrows found</h3>
                <p>Create your first escrow to get started</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyEscrows;