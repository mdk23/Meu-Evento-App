import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond, Jost, Cinzel, Lora } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Aurelia design system typefaces — Ethereal reads Cormorant Garamond/Jost,
// Neoclassical reads Cinzel/Lora. See src/app/aurelia.css for the token
// mapping that switches --font-display/--font-body/--font-data per theme.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

// Runs before hydration so the saved theme applies with no flash of the
// other theme's colours/backdrop.
const themeBootstrapScript = `
try {
  var t = localStorage.getItem('aurelia-theme');
  document.documentElement.dataset.theme = (t === 'ethereal' || t === 'neoclassical') ? t : 'ethereal';
} catch (e) {
  document.documentElement.dataset.theme = 'ethereal';
}
`;

export const metadata: Metadata = {
  title: "AuraVenue - Event Management Platform",
  description: "Enterprise event venue and operations management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${jost.variable} ${cinzel.variable} ${lora.variable} h-full antialiased dark`}
      // The bootstrap script below sets data-theme before React hydrates, specifically so the
      // saved theme applies with no flash — that's an intentional, expected mismatch against the
      // server-rendered markup (which never sets this attribute), not a real hydration bug.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-950">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
