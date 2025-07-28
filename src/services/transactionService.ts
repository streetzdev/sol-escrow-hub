import { Connection, PublicKey, ConfirmedSignatureInfo, ParsedTransactionWithMeta } from '@solana/web3.js';
import bs58 from 'bs58';

export interface WalletTransaction {
  signature: string;
  timestamp: Date;
  type: 'escrow_create' | 'escrow_take' | 'escrow_cancel' | 'escrow_update' | 'token_transfer' | 'other';
  status: 'success' | 'failed';
  fee: number;
  amount?: number;
  tokenSymbol?: string;
  tokenMint?: string;
  from?: string;
  to?: string;
  description: string;
}

class TransactionService {
  private connection: Connection;
  private escrowProgramId: PublicKey;

  constructor(connection: Connection) {
    this.connection = connection;
    this.escrowProgramId = new PublicKey('3ZSratuRHNTmgE9YHA6HanPGkBU1wfDT1ZgwqfsyC1yy');
  }

  // Fetch transaction history for a wallet
  async getWalletTransactions(walletAddress: PublicKey, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      // Get signature history
      const signatures = await this.connection.getSignaturesForAddress(walletAddress, { limit });
      
      if (signatures.length === 0) {
        return [];
      }

      // Get parsed transactions
      const transactions = await this.connection.getParsedTransactions(
        signatures.map(sig => sig.signature),
        { maxSupportedTransactionVersion: 0 }
      );

      const walletTransactions: WalletTransaction[] = [];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const sig = signatures[i];
        
        if (!tx || !tx.meta) continue;

        const walletTx = this.parseTransaction(tx, sig, walletAddress);
        if (walletTx) {
          walletTransactions.push(walletTx);
        }
      }

      return walletTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  // Parse a single transaction
  private parseTransaction(
    tx: ParsedTransactionWithMeta,
    sig: ConfirmedSignatureInfo,
    walletAddress: PublicKey
  ): WalletTransaction | null {
    try {
      const signature = sig.signature;
      const timestamp = new Date((sig.blockTime || 0) * 1000);
      const status = tx.meta?.err ? 'failed' : 'success';
      const fee = (tx.meta?.fee || 0) / 1e9; // Convert lamports to SOL

      // Check if this is an escrow program transaction
      const isEscrowTx = tx.transaction.message.instructions.some(ix => {
        if ('programId' in ix) {
          return ix.programId.equals(this.escrowProgramId);
        }
        return false;
      });

      let type: WalletTransaction['type'] = 'other';
      let description = 'Unknown transaction';

      if (isEscrowTx) {
        // Determine escrow transaction type based on instruction data
        const escrowInstruction = tx.transaction.message.instructions.find(ix => {
          if ('programId' in ix) {
            return ix.programId.equals(this.escrowProgramId);
          }
          return false;
        });

        if (escrowInstruction && 'data' in escrowInstruction) {
          const data = escrowInstruction.data;
          if (typeof data === 'string') {
            // Decode base58 instruction data
            const buffer = bs58.decode(data);
            if (buffer.length > 0) {
              const discriminator = buffer[0];
              switch (discriminator) {
                case 0:
                  type = 'escrow_create';
                  description = 'Created escrow agreement';
                  break;
                case 1:
                  type = 'escrow_take';
                  description = 'Accepted escrow agreement';
                  break;
                case 2:
                  type = 'escrow_update';
                  description = 'Updated escrow agreement';
                  break;
                case 3:
                  type = 'escrow_cancel';
                  description = 'Cancelled escrow agreement';
                  break;
                default:
                  description = 'Escrow program interaction';
              }
            }
          }
        }
      } else {
        // Check for token transfers
        const tokenTransfers = tx.meta?.preTokenBalances || [];
        const postTokenBalances = tx.meta?.postTokenBalances || [];
        
        if (tokenTransfers.length > 0 || postTokenBalances.length > 0) {
          type = 'token_transfer';
          description = 'Token transfer';
        } else {
          description = 'SOL transaction';
        }
      }

      // Extract token information for token transfers
      let amount: number | undefined;
      let tokenSymbol: string | undefined;
      let tokenMint: string | undefined;

      if (type === 'token_transfer' && tx.meta?.postTokenBalances && tx.meta?.preTokenBalances) {
        const preBalances = tx.meta.preTokenBalances;
        const postBalances = tx.meta.postTokenBalances;
        
        for (const postBalance of postBalances) {
          if (postBalance.owner === walletAddress.toString()) {
            const preBalance = preBalances.find(pre => 
              pre.accountIndex === postBalance.accountIndex
            );
            
            if (preBalance && postBalance.uiTokenAmount && preBalance.uiTokenAmount) {
              const amountChange = postBalance.uiTokenAmount.uiAmount! - preBalance.uiTokenAmount.uiAmount!;
              if (Math.abs(amountChange) > 0) {
                amount = Math.abs(amountChange);
                tokenSymbol = postBalance.uiTokenAmount.uiAmountString;
                tokenMint = postBalance.mint;
                break;
              }
            }
          }
        }
      }

      return {
        signature,
        timestamp,
        type,
        status,
        fee,
        amount,
        tokenSymbol,
        tokenMint,
        description,
      };
    } catch (error) {
      console.error('Error parsing transaction:', error);
      return null;
    }
  }

  // Get escrow-specific transactions
  async getEscrowTransactions(walletAddress: PublicKey): Promise<WalletTransaction[]> {
    const allTransactions = await this.getWalletTransactions(walletAddress, 100);
    return allTransactions.filter(tx => 
      tx.type.startsWith('escrow_')
    );
  }
}

export default TransactionService;