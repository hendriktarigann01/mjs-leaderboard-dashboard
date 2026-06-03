import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'MJS Leaderboard Admin Dashboard',
  description: 'Sistem konsolidasi, filter, dan ekspor data pemenang mingguan game MJS.',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${outfit.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-[#050505] text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
