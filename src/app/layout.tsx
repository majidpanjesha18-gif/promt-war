import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/persistence/AppContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "RescueLoop AI — Food Surplus Intelligence & Rescue Coordination",
  description: "Predict surplus. Coordinate rescue. Verify impact. Stateful failure-aware AI food rescue platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-light text-charcoal flex">
        <AppProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Navbar />
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
