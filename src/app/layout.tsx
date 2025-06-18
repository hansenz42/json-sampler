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
  title: "JSON Sampler | JSON 简短示例生成工具",
  description: "JSON 太长写到文档里不方便？JSON Sampler 帮助你生成一个简短的 JSON 示例。",
  keywords: ["JSON", "抽样", "数据", "简短", "示例", "文档"],
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
