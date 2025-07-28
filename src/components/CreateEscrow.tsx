
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowDownUp, Clock, Settings } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import TokenSelector from './TokenSelector';
import { useEscrow } from '@/hooks/useEscrow';

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

const CreateEscrow = () => {
  const { connected } = useWallet();
  const { toast } = useToast();
  const { createEscrow, loading } = useEscrow();
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [isMutable, setIsMutable] = useState(true);

  const handleCreateEscrow = async () => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an escrow",
        variant: "destructive",
      });
      return;
    }

    if (!tokenA || !tokenB || !amountA || !amountB) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const tokenAMint = new PublicKey(tokenA.address);
      const tokenBMint = new PublicKey(tokenB.address);
      const amountABigInt = BigInt(Math.floor(parseFloat(amountA) * Math.pow(10, tokenA.decimals)));
      const amountBBigInt = BigInt(Math.floor(parseFloat(amountB) * Math.pow(10, tokenB.decimals)));

      const success = await createEscrow({
        tokenA: tokenAMint,
        tokenB: tokenBMint,
        amountA: amountABigInt,
        amountB: amountBBigInt,
        expirationDays: parseInt(expirationDays),
        isMutable,
      });

      if (success) {
        // Reset form
        setTokenA(null);
        setTokenB(null);
        setAmountA('');
        setAmountB('');
        setExpirationDays('7');
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
    }
  };

  const swapTokens = () => {
    const tempToken = tokenA;
    const tempAmount = amountA;
    setTokenA(tokenB);
    setAmountA(amountB);
    setTokenB(tempToken);
    setAmountB(tempAmount);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span>Create New Escrow</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!connected && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                Connect your wallet to create an escrow
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-4">
              <TokenSelector
                selectedToken={tokenA}
                onTokenSelect={setTokenA}
                label="Token you're offering"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={swapTokens}
                className="rounded-full p-2 border-2"
              >
                <ArrowDownUp className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <TokenSelector
                selectedToken={tokenB}
                onTokenSelect={setTokenB}
                label="Token you want in return"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiration" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Expiration (days)</span>
              </Label>
              <Input
                id="expiration"
                type="number"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                min="1"
                max="365"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mutable" className="flex items-center space-x-2">
                <span>Allow updates</span>
              </Label>
              <div className="flex items-center space-x-2 h-12">
                <Switch
                  id="mutable"
                  checked={isMutable}
                  onCheckedChange={setIsMutable}
                />
                <span className="text-sm text-muted-foreground">
                  {isMutable ? 'Can be modified' : 'Immutable'}
                </span>
              </div>
            </div>
          </div>

          {tokenA && tokenB && amountA && amountB && (
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Escrow Preview</h3>
                <div className="space-y-1 text-sm">
                  <div>You give: {amountA} {tokenA.symbol}</div>
                  <div>You get: {amountB} {tokenB.symbol}</div>
                  <div>Rate: 1 {tokenA.symbol} = {(parseFloat(amountB) / parseFloat(amountA)).toFixed(4)} {tokenB.symbol}</div>
                  <div>Expires in: {expirationDays} days</div>
                  <div>Type: {isMutable ? 'Mutable' : 'Immutable'}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleCreateEscrow}
            disabled={!connected || loading || !tokenA || !tokenB || !amountA || !amountB}
            className="w-full h-12 text-base"
          >
            {loading ? 'Creating Escrow...' : 'Create Escrow'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEscrow;
