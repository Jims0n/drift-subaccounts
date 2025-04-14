import { create } from "zustand";
import { Connection, PublicKey,  } from '@solana/web3.js';
import { DriftClient, User, getUserAccountPublicKeySync, } from '@drift-labs/sdk';




 interface AppStoreState {
  // Connection
  connection: Connection | null;
  driftClient: DriftClient | null;
  setConnection: (connection: Connection) => void;
  setDriftClient: (driftClient: DriftClient) => void;

  // Wallet
  walletPublicKey: PublicKey | null;
  setWalletPublicKey: (publicKey: PublicKey | null) => void;

  // Custom wallet input
  customWalletAddress: string;
  setCustomWalletAddress: (address: string) => void;
  fetchingCustomWallet: boolean;
  setFetchingCustomWallet: (fetching: boolean) => void;

  // User/Subaccounts
  subaccounts: User[];
  setSubaccounts: (subaccounts: User[]) => void;
  selectedSubaccount: User | null;
  setSelectedSubaccount: (subaccount: User | null) => void;
  fetchingSubaccounts: boolean;
  setFetchingSubaccounts: (fetching: boolean) => void;
  
  // Custom subaccount ID
  customSubaccountId: number | null;
  setCustomSubaccountId: (id: number | null) => void;

  // UI state
  activeTab: 'balances' | 'positions' | 'orders';
  setActiveTab: (tab: 'balances' | 'positions' | 'orders') => void;
  
  // Fetch functions
  fetchSubaccounts: (authority: PublicKey) => Promise<void>;
  fetchCustomWalletSubaccounts: () => Promise<void>;
 
}



export const useAppStore = create<AppStoreState>((set, get) => ({
// Connection
connection: null,
driftClient: null,
setConnection: (connection) => set({ connection }),
setDriftClient: (driftClient) => set({ driftClient }),

// Wallet
  walletPublicKey: null,
  setWalletPublicKey: (publicKey) => set({ walletPublicKey: publicKey }),
  
  // Custom wallet input
  customWalletAddress: '',
  setCustomWalletAddress: (address) => set({ customWalletAddress: address }),
  fetchingCustomWallet: false,
  setFetchingCustomWallet: (fetching) => set({ fetchingCustomWallet: fetching }),
  
  // User/Subaccounts
  subaccounts: [],
  setSubaccounts: (subaccounts) => set({ subaccounts }),
  selectedSubaccount: null,
  setSelectedSubaccount: (subaccount) => set({ selectedSubaccount: subaccount }),
  fetchingSubaccounts: false,
  setFetchingSubaccounts: (fetching) => set({ fetchingSubaccounts: fetching }),
  
  // Custom subaccount ID
  customSubaccountId: null,
  setCustomSubaccountId: (id) => set({ customSubaccountId: id }),

  // UI state
  activeTab: 'balances',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Fetch functions
  fetchSubaccounts: async (authority) => {
    const { driftClient, connection, setSubaccounts, setFetchingSubaccounts, setSelectedSubaccount } = get();
    if (!driftClient || !connection) {
      console.error('Drift client or connection not initialized');
      return;
    }
    
    try {
      setFetchingSubaccounts(true);

      // Try a wider range of subaccount IDs
      // Some users might have subaccounts with higher IDs
      const subaccountIdsToTry = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const foundSubaccounts: User[] = [];

      for (const subaccountId of subaccountIdsToTry) {
        try {
          console.log(`Trying to fetch subaccount ID: ${subaccountId}`);

          // Get the user account public key directly using the SDK function
          // This avoids potential issues with the drift client state
          const programId = driftClient.program.programId;
          const userAccountKey = getUserAccountPublicKeySync(
            programId,
            authority,
            subaccountId
          );
          
          // Check if the account exists on-chain
          const accountInfo = await connection.getAccountInfo(userAccountKey);
          
          if (!accountInfo || accountInfo.data.length === 0) {
            console.log(`No subaccount found for ID ${subaccountId}`);
            continue; // Try the next subaccount ID
          }

          console.log(`Found account data for subaccount ${subaccountId}, attempting to load user`);

          // Try to get the user - this may  still fail if the account is not properly initialized
          try {
            // Ensure we're using the correct subaccount ID
            if (typeof driftClient.switchActiveUser === 'function') {
              console.log(`Switching active user to subaccount ${subaccountId} for authority ${authority.toString()}`);
              await driftClient.switchActiveUser(
                subaccountId,
                authority
              );
            } else {
              console.log('switchActiveUser function not available on driftClient');
            }

            // Try to get the user
            console.log(`Getting user for subaccount ${subaccountId} and authority ${authority.toString()}`);

            // First try to manually add the user to ensure it's in the client
            try {
              console.log(`Preemptively adding user with subaccount ${subaccountId}`);
              await driftClient.addUser(
                subaccountId,
                authority
              );
            } catch (addError) {
              console.log(`Note: Preemptive user add resulted in: ${addError}`);
              // This is expected in some cases, so we continue
            }
            
            const user = driftClient.getUser(subaccountId, authority);
            if (user) {
              console.log(`Successfully loaded user for subaccount ${subaccountId}`);
              foundSubaccounts.push(user);
            } else {
              console.log(`No user found for subaccount ${subaccountId}`);
            }
          } catch (error) {
            console.error(`Error loading user for subaccount ${subaccountId}:`, error);
          }
        } catch (error) {
          console.error(`Error fetching subaccount ${subaccountId} existence:`, error);
          // Continue to the next subaccount ID
        }
      }

      // If we found any subaccounts, update the store
      if (foundSubaccounts.length > 0) {
        console.log(`Found ${foundSubaccounts.length} subaccounts:`, foundSubaccounts);
        setSubaccounts(foundSubaccounts);
        setSelectedSubaccount(foundSubaccounts[0]);
      } else {
        console.log('No subaccounts found for this wallet on Drift Protocol');
        console.log('You may need to create a subaccount first at app.drift.trade');
        setSubaccounts([]);
        setSelectedSubaccount(null);
      }

    } catch (error) {
      console.error('Error in subaccount fetching process:', error);
      setSubaccounts([]);
      setSelectedSubaccount(null);
    } finally {
      setFetchingSubaccounts(false);
    }
  },

  fetchCustomWalletSubaccounts: async () => {
    const { customWalletAddress, setFetchingCustomWallet, fetchSubaccounts } = get();
    
    if (!customWalletAddress) return;
    
    try {
      setFetchingCustomWallet(true);
      const publicKey = new PublicKey(customWalletAddress);
      await fetchSubaccounts(publicKey);
    } catch (error) {
      console.error('Error fetching custom wallet subaccounts:', error);
    } finally {
      setFetchingCustomWallet(false);
    }
  },
  
}) );
