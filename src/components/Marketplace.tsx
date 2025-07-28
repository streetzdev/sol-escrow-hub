
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { Search, Clock, User, ArrowRightLeft, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEscrow } from '@/hooks/useEscrow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


const Marketplace = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const { marketplaceEscrows, takeEscrow, loading } = useEscrow();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredEscrows = useMemo(() => {
    return marketplaceEscrows
      .filter(escrow => {
        const searchLower = searchQuery.toLowerCase();
        return (
          escrow.tokenA.toString().toLowerCase().includes(searchLower) ||
          escrow.tokenB.toString().toLowerCase().includes(searchLower) ||
          escrow.maker.toString().toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'expiring':
            return Number(a.expiresAt) - Number(b.expiresAt);
          case 'newest':
          default:
            return Number(b.expiresAt) - Number(a.expiresAt);
        }
      });
  }, [marketplaceEscrows, searchQuery, sortBy]);

  const formatTimeRemaining = (expiresAt: bigint) => {
    const now = Date.now();
    const expirationTime = Number(expiresAt);
    if (expirationTime <= now) return 'Expired';
    return formatDistanceToNow(new Date(expirationTime), { addSuffix: false });
  };

  const handleTakeEscrow = async (escrow: any) => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to take this escrow",
        variant: "destructive",
      });
      return;
    }

    try {
      await takeEscrow(escrow.escrowPda, escrow);
    } catch (error) {
      console.error('Error taking escrow:', error);
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
          <Card key={escrow.escrowPda.toString()} className="glass-card hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold">A</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {(Number(escrow.amountA) / Math.pow(10, 9)).toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-sm">Token A</div>
                    </div>
                  </div>

                  <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-xs font-bold">B</span>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {(Number(escrow.amountB) / Math.pow(10, 9)).toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-sm">Token B</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end space-x-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{escrow.maker.toString().slice(0, 6)}...{escrow.maker.toString().slice(-4)}</span>
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
                    onClick={() => handleTakeEscrow(escrow)}
                    disabled={!connected || loading || escrow.status !== 'active'}
                    className="min-w-24"
                  >
                    {loading ? 'Taking...' : 'Take'}
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
