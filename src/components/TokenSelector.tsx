
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  label: string;
}

// Mock token data - in real app, fetch from Jupiter API
const POPULAR_TOKENS: Token[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg'
  },
];

const TokenSelector: React.FC<TokenSelectorProps> = ({ selectedToken, onTokenSelect, label }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredTokens = POPULAR_TOKENS.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12 px-3"
          >
            {selectedToken ? (
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedToken.logoURI} 
                  alt={selectedToken.symbol}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${selectedToken.symbol}&background=8b5cf6&color=fff&size=24`;
                  }}
                />
                <div className="text-left">
                  <div className="font-medium">{selectedToken.symbol}</div>
                  <div className="text-xs text-muted-foreground">{selectedToken.name}</div>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select token</span>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onTokenSelect(token);
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-accent/5 transition-colors"
              >
                <img 
                  src={token.logoURI} 
                  alt={token.symbol}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=8b5cf6&color=fff&size=32`;
                  }}
                />
                <div className="text-left">
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-sm text-muted-foreground">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default TokenSelector;
