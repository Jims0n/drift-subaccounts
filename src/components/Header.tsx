"use client";

import ConnectButton from "./ConnectButton";
import Link from "next/link";


export default function Header() {
  

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-gradient-to-r from-[#070814]/95 to-[#0A0C1B]/95 shadow-md border-b border-gray-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex flex-col">
            <Link href="/" className="flex items-center space-x-2 group">
              {/* Logo */}
              
              
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 group-hover:from-blue-400 group-hover:to-white transition-all duration-300">
                  Drift Viewer
                </h1>
                <span className="hidden sm:block text-xs text-gray-400 -mt-1">Subaccount Management</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
         
          <ConnectButton />
        </div>
      </div>
    </header>
  );
} 