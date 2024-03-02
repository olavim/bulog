import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BucketsProvider } from "@/components/BucketsProvider";
import { CodeSandboxProvider } from "@/components/CodeSandboxProvider";

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
        <CodeSandboxProvider>
          <BucketsProvider>
            {children}
          </BucketsProvider>
        </CodeSandboxProvider>
      </body>
    </html>
  );
}
