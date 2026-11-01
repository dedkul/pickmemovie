import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pickmemovie.vercel.app"),
  title: "PickMeMovie",
  description: "Sydney cinema sessions you can still make, worked out from where you are.",
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "PickMeMovie",
    title: "PickMeMovie — Films nearby. Times that fit.",
    description: "Sydney cinema sessions you can still make, worked out from where you are.",
    images: [{
      url: "/share/pickmemovie.jpg",
      width: 1200,
      height: 630,
      alt: "PickMeMovie. Films nearby. Times that fit. See what’s on. Know when to leave. Beside it, the app listing films you can still make tonight.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PickMeMovie — Films nearby. Times that fit.",
    description: "Sydney cinema sessions you can still make, worked out from where you are.",
    images: [{
      url: "/share/pickmemovie.jpg",
      alt: "PickMeMovie. Films nearby. Times that fit. See what’s on. Know when to leave. Beside it, the app listing films you can still make tonight.",
    }],
  },
};

// Theme before first paint: saved choice, else the OS setting.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem('pmm-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The theme script sets data-theme before React hydrates.
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
