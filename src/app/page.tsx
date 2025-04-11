import Header from "@/components/Header";
import WalletInfo from "@/components/WalletInfo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-900 text-white">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Drift Subaccounts</h1>
          <p className="text-xl text-gray-400">
            Connect your wallet to manage your Drift Protocol subaccounts
          </p>
        </div>
        
        <WalletInfo />
      </div>
    </main>
  );
}
