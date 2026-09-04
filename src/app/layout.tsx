import type { Metadata } from "next";
import { Noto_Sans_JP, Rajdhani } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import "./globals.css";

const notoSans = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const rajdhani = Rajdhani({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WIXOSS Team Match",
  description: "WIXOSSチーム戦のマッチングアプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${notoSans.variable} ${rajdhani.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#070b14] text-slate-100 antialiased">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
