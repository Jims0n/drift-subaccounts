"use client";

import { useWallet, Wallet } from "@solana/wallet-adapter-react";
import Image from "next/image";
import { useModalStore } from "@/stores/useModalStore";
import { Modal } from "./Modal";

interface WalletOptionProps {
  onClick: () => void;
  wallet: Wallet;
}

const WalletOption = ({ onClick, wallet }: WalletOptionProps) => {
  return (
    <div
      onClick={onClick}
      className="flex justify-between text-white transition-opacity cursor-pointer hover:opacity-60"
    >
      <div className="flex gap-2">
        <div className="w-6 h-6">
          {wallet.adapter.icon && (
            <Image
              src={wallet.adapter.icon}
              alt={wallet.adapter.name}
              width={24}
              height={24}
            />
          )}
        </div>
        <span>{wallet.adapter.name}</span>
      </div>
      <div className={wallet.adapter.connected ? "font-semibold text-green-400" : ""}>
        {wallet.adapter.connected
          ? "Connected"
          : wallet.adapter.readyState === "Installed"
            ? "Detected"
            : ""}
      </div>
    </div>
  );
};

export default function ConnectWalletModal() {
  const setModalStore = useModalStore((s) => s.set);
  const walletContext = useWallet();

  const handleOnClose = () => {
    setModalStore((s) => {
      s.modals.showConnectWalletModal = false;
    });
  };

  const handleConnectWallet = (wallet: Wallet) => {
    walletContext.select(wallet.adapter.name);
    wallet.adapter.connect();
  };

  return (
    <Modal onClose={handleOnClose} header="Connect Wallet">
      <div className="flex flex-col gap-6 min-w-[300px]">
        {walletContext?.wallets?.length > 0
          ? walletContext?.wallets?.map((wallet) => (
              <WalletOption
                key={wallet.adapter.name.toString()}
                wallet={wallet}
                onClick={() => handleConnectWallet(wallet)}
              />
            ))
          : "No Solana wallets found."}
      </div>
    </Modal>
  );
} 