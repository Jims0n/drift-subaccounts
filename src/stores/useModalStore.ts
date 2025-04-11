import { produce } from "immer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface ModalStore {
  set: (x: (s: ModalStore) => void) => void;
  get: () => ModalStore;
  modals: {
    showConnectWalletModal?: boolean;
  };
}

export const useModalStore = create<ModalStore>()(
  devtools(
    (set, get) => ({
      set: (fn) => set(produce(fn)),
      get: () => get(),
      modals: {
        showConnectWalletModal: false,
      },
    }),
    { name: "modal-store" }
  )
);
