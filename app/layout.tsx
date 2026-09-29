import './globals.css';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Inter, Poppins } from 'next/font/google';
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Space Scholar - 🚀 Explore the Universe of Knowledge',
  description: 'Embark on an interstellar journey of learning! Our AI-powered platform helps you navigate through infinite possibilities of knowledge discovery. 🌟',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render every page per request: the CSP nonce set in middleware.ts can
  // only be applied to Next.js's scripts during dynamic rendering.
  await connection();

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}