import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";

import { PreferencesProvider } from "@/components/preferences/preferences-provider";
import { getServerPreferences } from "@/lib/i18n/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Bengali script (Bangla) — pairs with system/Avro keyboard input. */
const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const preferencesBootstrapScript = `(function(){try{var c=document.cookie.split("; ").reduce(function(a,p){var x=p.split("=");a[x[0]]=decodeURIComponent(x.slice(1).join("="));return a},{});var l=c["socialbd-locale"];if(l==="bn"){document.documentElement.lang="bn";document.documentElement.classList.add("locale-bn");}else{document.documentElement.lang="en";document.documentElement.classList.remove("locale-bn");}var th=c["socialbd-theme"]||"system";var r=document.documentElement;r.dataset.theme=th;function d(on){if(on)r.classList.add("dark");else r.classList.remove("dark");}if(th==="dark")d(true);else if(th==="light")d(false);else d(window.matchMedia("(prefers-color-scheme: dark)").matches);}catch(e){}})();`;

export const metadata: Metadata = {
  title: "QueueOra — Social media scheduling made simple",
  description:
    "Schedule posts, manage teams, and grow your brand — priced in BDT with local payments.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, theme } = await getServerPreferences();

  return (
    <html
      lang={locale}
      data-theme={theme}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansBengali.variable} h-full antialiased`}
    >
      <head>
        {/* Inline bootstrap avoids next/script + React 19 "script tag while rendering" warning. */}
        <script
          id="socialbd-preferences"
          dangerouslySetInnerHTML={{ __html: preferencesBootstrapScript }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <PreferencesProvider initialLocale={locale} initialTheme={theme}>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
