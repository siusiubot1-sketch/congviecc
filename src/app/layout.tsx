import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { DataProvider } from "@/components/DataProvider";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "KOL Hub — Quản lý công việc KOL/KOC",
  description:
    "Dashboard tập trung quản lý công việc, khách hàng, nhãn hàng và hộp thư hợp nhất (Zalo, Gmail) với auto-reply theo kịch bản AI.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full">
        <AuthProvider>
          <DataProvider>
            <AppShell>{children}</AppShell>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
