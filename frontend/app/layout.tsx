import type { Metadata } from "next";
import Header from "@/src/components/header";
import Footer from "@/src/components/footer"
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // keep your global styles

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Albion Content Bot",
  description: "Modern toolkit for roles and content groups",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-[#0b0f17] text-[#e6ebf5]">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
