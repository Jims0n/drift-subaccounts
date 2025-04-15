import Header from "@/components/Header";
import WelcomeViewer from "@/components/WelcomeViewer";

export default function Home() {
  return (
    <main className="flex flex-col bg-[#020216] text-white">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <WelcomeViewer />
      </div>
    </main>
  );
}
