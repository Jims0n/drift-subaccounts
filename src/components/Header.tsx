"use client";

import ConnectButton from "./ConnectButton";

export default function Header() {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-slate-800 text-white">
      <div className="text-xl font-bold">Drift Subaccounts</div>
      <ConnectButton />
    </header>
  );
} 