import type { Metadata } from "next";
import { Archivo, Big_Shoulders_Display, IBM_Plex_Mono, IBM_Plex_Sans, Silkscreen } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AuthProvider } from "@/components/auth-provider";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const bigShoulders = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-condensed",
  display: "swap",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pixel",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "E-Cell SMVIT",
  description: "E-Cell SMVIT website: landing page, signup/login and member dashboard on Supabase Auth.",
  icons: {
    icon: [
      { url: "/img/logo-black.svg", media: "(prefers-color-scheme: light)" },
      { url: "/img/logo-white.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${bigShoulders.variable} ${silkscreen.variable} ${ibmPlexMono.variable} ${archivo.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ecell-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);if(t==="dark")document.documentElement.classList.add("dark");}}catch(_){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans antialiased">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
