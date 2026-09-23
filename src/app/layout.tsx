import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ProgressProvider } from "@/components/ProgressStore";
import SiteHeader from "@/components/SiteHeader";
import "highlight.js/styles/github-dark.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Symfony + DDD + TDD — CRUD completo de User",
  description:
    "Guía interactiva y por lecciones para construir un CRUD de usuarios con Symfony, MySQL, Doctrine, DDD y TDD, desde el dominio hasta CI/CD.",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('ddd-guide-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ProgressProvider>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </ProgressProvider>
      </body>
    </html>
  );
}
