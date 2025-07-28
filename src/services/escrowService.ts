import { Connection, PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

export interface EscrowAccount {
  maker: PublicKey;
  tokenA: PublicKey;
  tokenB: PublicKey;
  amountA: bigint;
  amountB: bigint;
  expiresAt: bigint;
  isMutable: boolean;
  status: 'active' | 'taken' | 'cancelled' | 'expired';
  escrowPda: PublicKey;
  escrowTokenAccount: PublicKey;
}

export interface CreateEscrowParams {
  tokenA: PublicKey;
  tokenB: PublicKey;
  amountA: bigint;
  amountB: bigint;
  expirationDays: number;
  isMutable: boolean;
}

class EscrowService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection) {
    this.connection = connection;
    this.programId = new PublicKey('3ZSratuRHNTmgE9YHA6HanPGkBU1wfDT1ZgwqfsyC1yy');
  }

  // Get escrow PDA
  async getEscrowPDA(maker: PublicKey, seed: number): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), maker.toBuffer(), Buffer.from(seed.toString())],
      this.programId
    );
  }

  // Get escrow token account PDA
  async getEscrowTokenAccountPDA(escrowPda: PublicKey, tokenMint: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_token'), escrowPda.toBuffer(), tokenMint.toBuffer()],
      this.programId
    );
  }

  // Create escrow instruction
  async createEscrowInstruction(
    wallet: WalletContextState,
    params: CreateEscrowParams,
    seed: number
  ): Promise<Transaction> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const [escrowPda] = await this.getEscrowPDA(wallet.publicKey, seed);
    const [escrowTokenAccount] = await this.getEscrowTokenAccountPDA(escrowPda, params.tokenA);
    
    const makerTokenAccount = await getAssociatedTokenAddress(params.tokenA, wallet.publicKey);

    const transaction = new Transaction();

    // Create instruction data
    const instructionData = Buffer.alloc(1 + 32 + 32 + 8 + 8 + 8 + 1 + 4);
    let offset = 0;
    
    // Instruction discriminator for 'make'
    instructionData.writeUInt8(0, offset);
    offset += 1;
    
    // Token A mint
    params.tokenA.toBuffer().copy(instructionData, offset);
    offset += 32;
    
    // Token B mint  
    params.tokenB.toBuffer().copy(instructionData, offset);
    offset += 32;
    
    // Amount A (8 bytes)
    instructionData.writeBigUInt64LE(params.amountA, offset);
    offset += 8;
    
    // Amount B (8 bytes)
    instructionData.writeBigUInt64LE(params.amountB, offset);
    offset += 8;
    
    // Expires at (8 bytes)
    const expiresAt = BigInt(Date.now() + params.expirationDays * 24 * 60 * 60 * 1000);
    instructionData.writeBigUInt64LE(expiresAt, offset);
    offset += 8;
    
    // Is mutable (1 byte)
    instructionData.writeUInt8(params.isMutable ? 1 : 0, offset);
    offset += 1;
    
    // Seed (4 bytes)
    instructionData.writeUInt32LE(seed, offset);

    const instruction = {
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: makerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: params.tokenA, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: instructionData,
    };

    transaction.add(instruction);
    return transaction;
  }

  // Fetch all escrows for a maker
  async getEscrowsForMaker(maker: PublicKey): Promise<EscrowAccount[]> {
    try {
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 8, // Skip discriminator
              bytes: maker.toBase58(),
            },
          },
        ],
      });

      return accounts.map(account => this.parseEscrowAccount(account.pubkey, account.account.data));
    } catch (error) {
      console.error('Error fetching maker escrows:', error);
      return [];
    }
  }

  // Fetch all active escrows (marketplace)
  async getAllActiveEscrows(): Promise<EscrowAccount[]> {
    try {
      const accounts = await this.connection.getProgramAccounts(this.programId);
      
      const escrows = accounts.map(account => 
        this.parseEscrowAccount(account.pubkey, account.account.data)
      );

      // Filter only active escrows
      return escrows.filter(escrow => 
        escrow.status === 'active' && 
        Number(escrow.expiresAt) > Date.now()
      );
    } catch (error) {
      console.error('Error fetching all escrows:', error);
      return [];
    }
  }

  // Parse escrow account data
  private parseEscrowAccount(pubkey: PublicKey, data: Buffer): EscrowAccount {
    let offset = 8; // Skip discriminator

    const maker = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const tokenA = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const tokenB = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    const amountA = data.readBigUInt64LE(offset);
    offset += 8;

    const amountB = data.readBigUInt64LE(offset);
    offset += 8;

    const expiresAt = data.readBigUInt64LE(offset);
    offset += 8;

    const isMutable = data.readUInt8(offset) === 1;
    offset += 1;

    // Determine status based on current time
    let status: 'active' | 'taken' | 'cancelled' | 'expired' = 'active';
    if (Number(expiresAt) <= Date.now()) {
      status = 'expired';
    }

    return {
      maker,
      tokenA,
      tokenB,
      amountA,
      amountB,
      expiresAt,
      isMutable,
      status,
      escrowPda: pubkey,
      escrowTokenAccount: pubkey, // This would need to be calculated properly
    };
  }

  // Take escrow
  async takeEscrow(
    wallet: WalletContextState,
    escrowPda: PublicKey,
    escrow: EscrowAccount
  ): Promise<Transaction> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const takerTokenAccountA = await getAssociatedTokenAddress(escrow.tokenA, wallet.publicKey);
    const takerTokenAccountB = await getAssociatedTokenAddress(escrow.tokenB, wallet.publicKey);
    const [escrowTokenAccount] = await this.getEscrowTokenAccountPDA(escrowPda, escrow.tokenA);

    const transaction = new Transaction();

    // Create instruction data for 'take'
    const instructionData = Buffer.alloc(1);
    instructionData.writeUInt8(1, 0); // Instruction discriminator for 'take'

    const instruction = {
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: escrow.maker, isSigner: false, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: takerTokenAccountA, isSigner: false, isWritable: true },
        { pubkey: takerTokenAccountB, isSigner: false, isWritable: true },
        { pubkey: escrow.tokenA, isSigner: false, isWritable: false },
        { pubkey: escrow.tokenB, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: instructionData,
    };

    transaction.add(instruction);
    return transaction;
  }

  // Cancel escrow
  async cancelEscrow(
    wallet: WalletContextState,
    escrowPda: PublicKey,
    escrow: EscrowAccount
  ): Promise<Transaction> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!escrow.maker.equals(wallet.publicKey)) {
      throw new Error('Only the maker can cancel this escrow');
    }

    const makerTokenAccount = await getAssociatedTokenAddress(escrow.tokenA, wallet.publicKey);
    const [escrowTokenAccount] = await this.getEscrowTokenAccountPDA(escrowPda, escrow.tokenA);

    const transaction = new Transaction();

    // Create instruction data for 'cancel'
    const instructionData = Buffer.alloc(1);
    instructionData.writeUInt8(3, 0); // Instruction discriminator for 'cancel'

    const instruction = {
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: escrowTokenAccount, isSigner: false, isWritable: true },
        { pubkey: makerTokenAccount, isSigner: false, isWritable: true },
        { pubkey: escrow.tokenA, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: instructionData,
    };

    transaction.add(instruction);
    return transaction;
  }
}

export default EscrowService;