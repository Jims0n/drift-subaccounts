import { PublicKey } from "@solana/web3.js";
import { create } from "zustand";
import { produce } from "immer";
import { devtools } from "zustand/middleware";

export interface WalletStore {
  set: (x: (s: WalletStore) => void) => void;
  get: () => WalletStore;
  authority?: PublicKey;
  authorityString: string;
  isWalletConnected: boolean;
}

export const useWalletStore = create<WalletStore>()(
  devtools(
    (set, get) => ({
      set: (fn) => set(produce(fn)),
      get: () => get(),
      authority: undefined,
      authorityString: "",
      isWalletConnected: false,
    }),
    { name: "wallet-store" }
  )
); 