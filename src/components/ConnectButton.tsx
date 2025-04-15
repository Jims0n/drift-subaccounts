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
        className={`flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-[#2A4CAD] to-[#3053AB] rounded-lg hover:from-[#3053AB] hover:to-[#3A5EC7] transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-blue-900/20 ${className}`}
        onClick={openConnectWalletModal}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className={`flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-[#1F7035] to-[#288D41] rounded-lg hover:from-[#288D41] hover:to-[#339D52] transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-green-900/20 ${className}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
          <span>{abbreviateAddress(authority.toString())}</span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-xl z-10 border border-gray-700/50 backdrop-blur-sm overflow-hidden animate-fadeIn">
          
          <div className="py-2">
            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-2 text-left text-white hover:bg-gradient-to-r hover:from-[#8D282B]/80 hover:to-[#9A3034]/80 transition-all flex items-center gap-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
