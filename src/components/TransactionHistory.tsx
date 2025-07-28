
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@solana/wallet-adapter-react';
import { History, ExternalLink } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'make' | 'take' | 'cancel' | 'update';
  signature: string;
  timestamp: Date;
  tokenA: { symbol: string; amount: string };
  tokenB: { symbol: string; amount: string };
  status: 'confirmed' | 'pending' | 'failed';
}

// Mock transaction data
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'make',
    signature: '5j7K8L9M3N4P5Q6R7S8T9U1V2W3X4Y5Z6A7B8C9D1E2F',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tokenA: { symbol: 'SOL', amount: '5' },
    tokenB: { symbol: 'USDC', amount: '1250' },
    status: 'confirmed',
  },
  {
    id: '2',
    type: 'take',
    signature: '3a4B5C6D7E8F9G1H2I3J4K5L6M7N8O9P1Q2R3S4T5U6V',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tokenA: { symbol: 'USDC', amount: '1000' },
    tokenB: { symbol: 'SOL', amount: '4' },
    status: 'confirmed',
  },
  {
    id: '3',
    type: 'cancel',
    signature: '7w8X9Y1Z2A3B4C5D6E7F8G9H1I2J3K4L5M6N7O8P9Q1R',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    tokenA: { symbol: 'USDT', amount: '2000' },
    tokenB: { symbol: 'SOL', amount: '8' },
    status: 'confirmed',
  },
];

const TransactionHistory = () => {
  const { connected } = useWallet();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'make':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'take':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'cancel':
        return 'bg-red-500/20 text-red-700 dark:text-red-300';
      case 'update':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'make':
        return 'Created';
      case 'take':
        return 'Completed';
      case 'cancel':
        return 'Canceled';
      case 'update':
        return 'Updated';
      default:
        return type;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const timeDiff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return 'Just now';
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Connect your wallet</h3>
          <p>Connect your wallet to view your transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <Badge variant="outline" className="px-3 py-1">
          {MOCK_TRANSACTIONS.length} Transactions
        </Badge>
      </div>

      <div className="space-y-3">
        {MOCK_TRANSACTIONS.map((tx) => (
          <Card key={tx.id} className="glass-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge className={getTypeColor(tx.type)}>
                    {getTypeLabel(tx.type)}
                  </Badge>
                  <div>
                    <div className="font-medium">
                      {tx.tokenA.amount} {tx.tokenA.symbol} ⇄ {tx.tokenB.amount} {tx.tokenB.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {tx.status}
                  </Badge>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {MOCK_TRANSACTIONS.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p>Your escrow transactions will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
