import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useToast } from '@/hooks/use-toast';
import EscrowService, { EscrowAccount, CreateEscrowParams } from '@/services/escrowService';
import TransactionService, { WalletTransaction } from '@/services/transactionService';

export const useEscrow = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { toast } = useToast();
  
  const [escrowService] = useState(() => new EscrowService(connection));
  const [transactionService] = useState(() => new TransactionService(connection));
  
  const [userEscrows, setUserEscrows] = useState<EscrowAccount[]>([]);
  const [marketplaceEscrows, setMarketplaceEscrows] = useState<EscrowAccount[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's escrows
  const fetchUserEscrows = useCallback(async () => {
    if (!publicKey) {
      setUserEscrows([]);
      return;
    }

    try {
      setLoading(true);
      const escrows = await escrowService.getEscrowsForMaker(publicKey);
      setUserEscrows(escrows);
    } catch (error) {
      console.error('Error fetching user escrows:', error);
      toast({
        title: "Error fetching escrows",
        description: "Failed to load your escrows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [publicKey, escrowService, toast]);

  // Fetch marketplace escrows
  const fetchMarketplaceEscrows = useCallback(async () => {
    try {
      setLoading(true);
      const escrows = await escrowService.getAllActiveEscrows();
      setMarketplaceEscrows(escrows);
    } catch (error) {
      console.error('Error fetching marketplace escrows:', error);
      toast({
        title: "Error fetching marketplace",
        description: "Failed to load marketplace escrows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [escrowService, toast]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!publicKey) {
      setTransactions([]);
      return;
    }

    try {
      setLoading(true);
      const txs = await transactionService.getWalletTransactions(publicKey);
      setTransactions(txs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error fetching transactions",
        description: "Failed to load transaction history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [publicKey, transactionService, toast]);

  // Create escrow
  const createEscrow = useCallback(async (params: CreateEscrowParams): Promise<boolean> => {
    if (!publicKey || !sendTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an escrow",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      // Generate a random seed for the escrow
      const seed = Math.floor(Math.random() * 1000000);
      
      const transaction = await escrowService.createEscrowInstruction(
        { publicKey, sendTransaction } as any,
        params,
        seed
      );

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      toast({
        title: "Escrow created successfully!",
        description: `Transaction: ${signature.slice(0, 8)}...`,
      });

      // Refresh data
      await Promise.all([
        fetchUserEscrows(),
        fetchMarketplaceEscrows(),
        fetchTransactions()
      ]);

      return true;
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast({
        title: "Failed to create escrow",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, connection, escrowService, toast, fetchUserEscrows, fetchMarketplaceEscrows, fetchTransactions]);

  // Take escrow
  const takeEscrow = useCallback(async (escrowPda: PublicKey, escrow: EscrowAccount): Promise<boolean> => {
    if (!publicKey || !sendTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to take this escrow",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      const transaction = await escrowService.takeEscrow(
        { publicKey, sendTransaction } as any,
        escrowPda,
        escrow
      );

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      toast({
        title: "Escrow taken successfully!",
        description: `Transaction: ${signature.slice(0, 8)}...`,
      });

      // Refresh data
      await Promise.all([
        fetchUserEscrows(),
        fetchMarketplaceEscrows(),
        fetchTransactions()
      ]);

      return true;
    } catch (error) {
      console.error('Error taking escrow:', error);
      toast({
        title: "Failed to take escrow",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, connection, escrowService, toast, fetchUserEscrows, fetchMarketplaceEscrows, fetchTransactions]);

  // Cancel escrow
  const cancelEscrow = useCallback(async (escrowPda: PublicKey, escrow: EscrowAccount): Promise<boolean> => {
    if (!publicKey || !sendTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to cancel this escrow",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      const transaction = await escrowService.cancelEscrow(
        { publicKey, sendTransaction } as any,
        escrowPda,
        escrow
      );

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      toast({
        title: "Escrow cancelled successfully!",
        description: `Transaction: ${signature.slice(0, 8)}...`,
      });

      // Refresh data
      await Promise.all([
        fetchUserEscrows(),
        fetchMarketplaceEscrows(),
        fetchTransactions()
      ]);

      return true;
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      toast({
        title: "Failed to cancel escrow",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, sendTransaction, connection, escrowService, toast, fetchUserEscrows, fetchMarketplaceEscrows, fetchTransactions]);

  // Load data when wallet connects
  useEffect(() => {
    if (publicKey) {
      Promise.all([
        fetchUserEscrows(),
        fetchMarketplaceEscrows(),
        fetchTransactions()
      ]);
    } else {
      setUserEscrows([]);
      setTransactions([]);
    }
  }, [publicKey, fetchUserEscrows, fetchMarketplaceEscrows, fetchTransactions]);

  return {
    userEscrows,
    marketplaceEscrows,
    transactions,
    loading,
    createEscrow,
    takeEscrow,
    cancelEscrow,
    refetch: () => Promise.all([
      fetchUserEscrows(),
      fetchMarketplaceEscrows(),
      fetchTransactions()
    ]),
  };
};