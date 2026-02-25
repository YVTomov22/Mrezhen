import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/sidebar-shell";
import { MainShell } from "@/components/main-shell";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Mrezhen",
  description: "Smart choices, better lives.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();
  const isLoggedIn = !!session?.user;

  /* ── Read accessibility preferences from DB ────────── */
  let fontSize = "medium";
  let highContrast = false;
  let screenReader = false;
  let reduceMotion = false;

  if (session?.user?.email) {
    const prefs = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { fontSize: true, highContrast: true, screenReader: true, reduceMotion: true },
    });
    if (prefs) {
      fontSize = prefs.fontSize ?? "medium";
      highContrast = prefs.highContrast ?? false;
      screenReader = prefs.screenReader ?? false;
      reduceMotion = prefs.reduceMotion ?? false;
    }
  }

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-font-size={fontSize}
      {...(highContrast ? { "data-high-contrast": "" } : {})}
      {...(screenReader ? { "data-screen-reader": "" } : {})}
      {...(reduceMotion ? { "data-reduce-motion": "" } : {})}
    >
      <body className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
        {/* Skip-to-content link — visible on focus for keyboard / screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:border focus:border-ring"
        >
          Skip to content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <SidebarProvider>
              <Navbar />
              <MainShell isLoggedIn={isLoggedIn}>
                  {children}
              </MainShell>
            </SidebarProvider>
            <Toaster position="bottom-right" richColors closeButton />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}