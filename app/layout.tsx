import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Synapse - Claude Skills Marketplace",
  description: "Discover, create, and deploy AI assistant skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <Providers>
          <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-8">
            <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4">
              <Link href="/" className="text-xl font-bold tracking-tight">
                Synapse
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/skills">Skills</Link>
                <Link href="/skills/create">Create</Link>
                <Link href="/login">Login</Link>
              </nav>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

