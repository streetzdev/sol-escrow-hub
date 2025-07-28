
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { Search, Clock, User, ArrowRightLeft, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MockEscrow {
  id: string;
  maker: string;
  tokenA: { symbol: string; amount: string; logoURI: string };
  tokenB: { symbol: string; amount: string; logoURI: string };
  expiresAt: Date;
  isMutable: boolean;
  status: 'active' | 'expired' | 'taken';
}

// Mock data
const MOCK_ESCROWS: MockEscrow[] = [
  {
    id: '1',
    maker: 'Abc...xyz1',
    tokenA: { symbol: 'SOL', amount: '10', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    tokenB: { symbol: 'USDC', amount: '2500', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    isMutable: true,
    status: 'active',
  },
  {
    id: '2',
    maker: 'Def...abc2',
    tokenA: { symbol: 'USDC', amount: '1000', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
    tokenB: { symbol: 'SOL', amount: '4', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isMutable: false,
    status: 'active',
  },
  {
    id: '3',
    maker: 'Ghi...def3',
    tokenA: { symbol: 'USDT', amount: '5000', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg' },
    tokenB: { symbol: 'SOL', amount: '20', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    isMutable: true,
    status: 'active',
  },
];

const Marketplace = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const [escrows, setEscrows] = useState<MockEscrow[]>(MOCK_ESCROWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isLoading, setIsLoading] = useState(false);

  const filteredEscrows = escrows
    .filter(escrow => 
      escrow.tokenA.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.tokenB.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      escrow.maker.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'expiring':
          return a.expiresAt.getTime() - b.expiresAt.getTime();
        case 'newest':
        default:
          return b.expiresAt.getTime() - a.expiresAt.getTime();
      }
    });

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleTakeEscrow = async (escrowId: string) => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to take an escrow",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate taking escrow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update escrow status
      setEscrows(prev => prev.map(escrow => 
        escrow.id === escrowId 
          ? { ...escrow, status: 'taken' as const }
          : escrow
      ));
      
      toast({
        title: "Escrow taken successfully!",
        description: "The tokens have been exchanged",
      });
    } catch (error) {
      toast({
        title: "Failed to take escrow",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by token or maker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48 h-12">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredEscrows.map((escrow) => (
          <Card key={escrow.id} className="glass-card hover:shadow-lg transition-all duration-200">
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
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{escrow.maker}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTimeRemaining(escrow.expiresAt)}</span>
                    </div>
                    {escrow.isMutable && (
                      <Badge variant="secondary" className="text-xs">
                        Mutable
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => handleTakeEscrow(escrow.id)}
                    disabled={!connected || isLoading || escrow.status !== 'active'}
                    className="min-w-24"
                  >
                    {isLoading ? 'Taking...' : 'Take'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredEscrows.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No escrows found</h3>
                <p>Try adjusting your search or create a new escrow</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
