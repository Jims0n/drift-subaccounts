import { produce } from "immer";
import { create } from "zustand";


export interface AppStoreState {
  set: (x: (s: AppStoreState) => void) => void;
  get: () => AppStoreState;
 
}

const DEFAULT_APP_STORE_STATE = {};

const useAppStore = create<AppStoreState>((set, get) => {
  const setProducerFn = (fn: (s: AppStoreState) => void) => set(produce(fn));
  return {
    ...DEFAULT_APP_STORE_STATE,
    set: setProducerFn,
    get: () => get(),
   
  };
});

export default useAppStore;
