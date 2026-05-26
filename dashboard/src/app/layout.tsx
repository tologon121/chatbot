import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL('https://nexusai-sooty-pi.vercel.app'),
  title: "NexusAI | Dashboard",
  description: "Manage your embeddable AI widget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
