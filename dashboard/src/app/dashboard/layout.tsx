import Sidebar from "@/components/Sidebar";
import { WidgetProvider } from "@/components/WidgetContext";
import WidgetPicker from "@/components/WidgetPicker";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WidgetProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative">
          <div className="sticky top-0 z-20 backdrop-blur-xl bg-[var(--background)]/80 border-b border-[var(--border)] px-6 md:px-10 py-3 flex items-center justify-end gap-3">
            <WidgetPicker />
          </div>
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 md:py-12">
            {children}
          </div>
        </main>
      </div>
    </WidgetProvider>
  );
}
