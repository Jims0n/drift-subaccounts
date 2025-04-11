import { useWalletStore } from "@/stores/useWalletStore";
import { useModalStore } from "@/stores/useModalStore";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";

/**
 * Keeps the authority and connected state of `WalletContext` from `@solana/wallet-adapter-react` updated in the wallet store when the wallet connects, disconnects, or changes.
 */
const useSyncWalletToStore = () => {
  const setWalletStore = useWalletStore((s) => s.set);
  const walletContextState = useWallet();
  const setModalStore = useModalStore((s) => s.set);

  const closeConnectWalletModal = () => {
    setModalStore((s) => {
      s.modals.showConnectWalletModal = false;
    });
  };

  useEffect(() => {
    const handleConnect = () => {
      console.log("Wallet connected");
      const authority = walletContextState?.wallet?.adapter?.publicKey;

      setWalletStore((s) => {
        s.authority = authority || undefined;
        s.authorityString = authority?.toString() || "";
        s.isWalletConnected = true;
      });

      if (authority && walletContextState.wallet?.adapter) {
        closeConnectWalletModal();
      }
    };

    const handleDisconnect = () => {
      console.log("Wallet disconnected");
      setWalletStore((s) => {
        s.authority = undefined;
        s.authorityString = "";
        s.isWalletConnected = false;
      });
    };

    // Check if wallet is already connected
    if (walletContextState.connected && walletContextState.wallet?.adapter?.publicKey) {
      handleConnect();
    }

    walletContextState?.wallet?.adapter?.on("connect", handleConnect);
    walletContextState?.wallet?.adapter?.on("disconnect", handleDisconnect);

    return () => {
      walletContextState?.wallet?.adapter?.off?.("connect", handleConnect);
      walletContextState?.wallet?.adapter?.off?.("disconnect", handleDisconnect);
    };
  }, [walletContextState?.wallet?.adapter]);
};

export default useSyncWalletToStore;
