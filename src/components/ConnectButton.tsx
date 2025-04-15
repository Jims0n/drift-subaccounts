"use client";

import { useModalStore } from "@/stores/useModalStore";
import { useWalletStore } from "@/stores/useWalletStore";
import { abbreviateAddress } from "@/utils/address";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useRef, useEffect } from "react";

interface ConnectButtonProps {
  className?: string;
}

export default function ConnectButton({ className }: ConnectButtonProps) {
  const authority = useWalletStore((s) => s.authority);
  const setModalStore = useModalStore((s) => s.set);
  const { disconnect } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const openConnectWalletModal = () => {
    setModalStore((s) => {
      s.modals.showConnectWalletModal = true;
    });
  };

  const handleDisconnect = () => {
    disconnect();
    setIsMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!authority) {
    return (
      <button
        className={`flex items-center gap-2 px-4 py-2 text-white bg-[#3053AB] rounded-lg hover:bg-blue-700 transition-colors ${className}`}
        onClick={openConnectWalletModal}
      >
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`flex items-center gap-2 px-4 py-2 text-white bg-[#288D41] rounded-lg hover:bg-[#288D41] transition-colors ${className}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span>{abbreviateAddress(authority.toString())}</span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg z-10">
          <div className="py-2">
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left text-white hover:bg-[#8D282B] transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
