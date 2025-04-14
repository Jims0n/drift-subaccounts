"use client";

import ConnectButton from "./ConnectButton";

export default function Header() {
  return (
    <header className="px-6 py-4 flex justify-between items-center bg-transparent text-white">
      <div className="text-xl font-bold">Drift Subaccount Viewer</div>
      <ConnectButton />
    </header>
  );
} 