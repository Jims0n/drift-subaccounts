"use client";

import React from "react";

import ConnectWalletModal from "./ConnectWalletModal";
import { useModalStore } from "@/stores/useModalStore";

function FloatingUi() {
  const { showConnectWalletModal } = useModalStore((s) => s.modals);

  return <>{showConnectWalletModal ? <ConnectWalletModal /> : <></>}</>;
}

export default React.memo(FloatingUi);
