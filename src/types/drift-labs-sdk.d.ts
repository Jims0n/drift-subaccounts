declare module '@drift-labs/sdk' {
  import { Connection, PublicKey, Transaction } from '@solana/web3.js';
  
  export type DriftEnv = 'mainnet-beta' | 'devnet';
  
  export interface IWallet {
    publicKey: PublicKey;
    signTransaction: (tx: Transaction) => Promise<Transaction>;
    signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
  }
  
  export class BN {
    constructor(value: string | number | BN);
    toString(): string;
    isZero(): boolean;
  }
  
  export const QUOTE_SPOT_MARKET_INDEX = 0;
  
  export enum OrderType {
    LIMIT,
    MARKET,
    TRIGGER_MARKET,
    TRIGGER_LIMIT,
    ORACLE
  }
  
  export enum OrderStatus {
    OPEN,
    FILLED,
    CANCELED
  }
  
  export interface SpotPosition {
    marketIndex: number;
    scaledBalance: BN;
  }
  
  export interface UserAccount {
    spotPositions: SpotPosition[];
  }
  
  export interface DriftOrder {
    orderType: OrderType;
    direction: string;
    price: BN;
    status: OrderStatus;
    baseAssetAmount: BN;
    marketIndex: number;
    reduceOnly: boolean;
  }
  
  export class User {
    getOpenOrders(): DriftOrder[];
    getUserAccount(): UserAccount;
    getTokenAmount(marketIndex: number): BN;
    fetchAccounts(): Promise<void>;
  }
  
  export interface OracleData {
    price: BN;
  }
  
  export interface SpotMarketAccount {
    marketIndex: number;
    name: string;
  }
  
  export class DriftClient {
    constructor(config: DriftClientConfig);
    
    // Methods
    subscribe(): Promise<void>;
    getUser(subaccountId: number, authority: PublicKey): User;
    addUser(subaccountId: number, authority: PublicKey): Promise<void>;
    switchActiveUser(subaccountId: number, authority: PublicKey): Promise<void>;
    getSpotMarketAccount(marketIndex: number): Promise<SpotMarketAccount>;
    getOracleDataForSpotMarket(marketIndex: number): OracleData;
    
    // Properties
    program: {
      programId: PublicKey;
    };
  }
  
  export interface DriftClientConfig {
    connection: Connection;
    wallet: IWallet;
    env: DriftEnv;
    opts?: {
      skipPreflight?: boolean;
      commitment?: string;
    };
    activeSubAccountId?: number;
    userStats?: boolean;
    accountSubscription?: {
      type: 'polling' | 'websocket';
      accountLoader?: BulkAccountLoader;
      resubTimeoutMs?: number;
      commitment?: string;
    };
  }
  
  export class BulkAccountLoader {
    constructor(connection: Connection, commitment: string, pollingFrequencyMs: number);
  }
  
  export function initialize(config: { env: DriftEnv }): Promise<void>;
  
  export function getUserAccountPublicKeySync(
    programId: PublicKey,
    authority: PublicKey,
    subaccountId: number
  ): PublicKey;
} 