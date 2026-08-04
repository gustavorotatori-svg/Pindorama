import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prospecção Pindorama",
  description: "Sistema de prospecção para cachaça Pindorama",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <nav className="bg-green-900 text-white p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="font-bold text-lg">Pipeline</a>
              <a href="/reports" className="opacity-80 hover:opacity-100">Relatórios</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
