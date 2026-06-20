import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { LocalStoragePolyfill } from "@/components/LocalStoragePolyfill";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoalForge AI",
  description: "AI-powered goal planning and performance insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LocalStoragePolyfill />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
