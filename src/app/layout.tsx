import type { Metadata } from "next";
import { WalletProvider } from "@/providers/WalletProvider";
import FloatingUi from "@/components/modals/FloatingUi";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Drift Subaccounts",
  description: "Manage your Drift Protocol subaccounts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
          {/** Floating Content */}
          <FloatingUi />
          <Toaster toastOptions={{ duration: 8000 }} />
        </WalletProvider>
      </body>
    </html>
  );
}
