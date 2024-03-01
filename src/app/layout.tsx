import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BucketsProvider } from "@/components/LogsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bulog UI",
  description: "Application log viewer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BucketsProvider>
          {children}
        </BucketsProvider>
      </body>
    </html>
  );
}
