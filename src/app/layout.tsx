import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Logística Shopee",
  description: "Sistema de controle de entregas Shopee",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Logística",
  },
};

export const viewport: Viewport = {
  themeColor: "#ee4d2d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
