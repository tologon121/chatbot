import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
