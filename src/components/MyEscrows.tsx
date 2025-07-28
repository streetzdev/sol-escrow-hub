
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { Settings, Trash2, Clock, ArrowRightLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEscrow } from '@/hooks/useEscrow';

interface MyEscrow {
  id: string;
  tokenA: { symbol: string; amount: string; logoURI: string };
  tokenB: { symbol: string; amount: string; logoURI: string };
  expiresAt: Date;
  isMutable: boolean;
  status: 'active' | 'expired' | 'taken';
}

// Mock data for user's escrows
const MOCK_USER_ESCROWS: MyEscrow[] = [
  {
    id: '1',
    tokenA: { symbol: 'SOL', amount: '5', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    tokenB: { symbol: 'USDC', amount: '1250', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    isMutable: true,
    status: 'active',
  },
  {
    id: '2',
    tokenA: { symbol: 'USDT', amount: '2000', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg' },
    tokenB: { symbol: 'SOL', amount: '8', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isMutable: false,
    status: 'expired',
  },
];

const MyEscrows = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const { userEscrows, cancelEscrow, loading } = useEscrow();

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleCancelEscrow = async (escrowId: string) => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate canceling escrow
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Remove escrow from list
      setEscrows(prev => prev.filter(escrow => escrow.id !== escrowId));
      
      toast({
        title: "Escrow canceled successfully!",
        description: "Your tokens have been returned",
      });
    } catch (error) {
      toast({
        title: "Failed to cancel escrow",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        {escrows.map((escrow) => (
          <Card key={escrow.id} className="glass-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={escrow.tokenA.logoURI} 
                      alt={escrow.tokenA.symbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${escrow.tokenA.symbol}&background=8b5cf6&color=fff&size=40`;
                      }}
                    />
                    <div>
                      <div className="font-semibold text-lg">{escrow.tokenA.amount}</div>
                      <div className="text-muted-foreground text-sm">{escrow.tokenA.symbol}</div>
                    </div>
                  </div>

                  <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />

                  <div className="flex items-center space-x-3">
                    <img 
                      src={escrow.tokenB.logoURI} 
                      alt={escrow.tokenB.symbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${escrow.tokenB.symbol}&background=14b8a6&color=fff&size=40`;
                      }}
                    />
                    <div>
                      <div className="font-semibold text-lg">{escrow.tokenB.amount}</div>
                      <div className="text-muted-foreground text-sm">{escrow.tokenB.symbol}</div>
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
                        onClick={() => handleUpdateEscrow(escrow.id)}
                        disabled={isLoading}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    )}
                    {escrow.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelEscrow(escrow.id)}
                        disabled={isLoading}
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

        {escrows.length === 0 && (
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
