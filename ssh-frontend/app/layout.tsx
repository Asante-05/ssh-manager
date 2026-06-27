import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import LogoutButton from "./components/LogoutButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SSH Manager",
  description: "Manage and connect to your SSH servers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" />
            <Link href="/" className="font-mono text-sm font-semibold tracking-widest text-zinc-100 hover:text-emerald-400 transition-colors uppercase">
              SSH Manager
            </Link>
          </div>
          <LogoutButton />
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
