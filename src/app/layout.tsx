import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorProvider } from "@/contexts/ErrorContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JSON Sampler | JSON 列表抽样工具",
  description: "为开发者打造的，过长 JSON 的抽样工具",
  keywords: ["JSON", "抽样", "数据"],
  authors: [{ name: "Hansen Zheng" }],
  creator: "Hansen Zheng",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-background to-background/95 text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorProvider>
            <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-10 pointer-events-none z-[-1]"></div>
            <div className="fixed inset-0 bg-gradient-radial from-transparent to-background/80 pointer-events-none z-[-1]"></div>
            {children}
          </ErrorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
