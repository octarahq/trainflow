import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import "@/styles/map.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Trainflow - Trafic ferroviaire en temps réel",
    template: "%s | Trainflow",
  },
  description:
    "Visualisez le trafic des trains SNCF en temps réel sur une carte interactive. Suivez les retards, les horaires et la position exacte des trains.",
  keywords: [
    "train",
    "sncf",
    "idfm",
    "temps réel",
    "carte",
    "trafic",
    "retard",
    "horaire",
    "ratp",
    "transilien",
    "rer",
    "ter",
    "tgv",
    "intercités",
  ],
  authors: [{ name: "Trainflow" }],
  creator: "Trainflow",
  publisher: "Trainflow",
  metadataBase: new URL("https://trainflow.lmcgroup.xyz"),
  openGraph: {
    title: "Trainflow - Trafic ferroviaire en temps réel",
    description:
      "Visualisez le trafic des trains SNCF en temps réel sur une carte interactive. Suivez les retards, les horaires et la position exacte des trains.",
    url: "https://trainflow.lmcgroup.xyz",
    siteName: "Trainflow",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/banner/trainflow-banner.png",
        width: 1200,
        height: 630,
        alt: "Trainflow Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trainflow - Trafic ferroviaire en temps réel",
    description:
      "Visualisez le trafic des trains SNCF et IDFM en temps réel sur une carte interactive.",
    images: ["/banner/trainflow-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <html suppressHydrationWarning>
        <head>
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-QZ5KK79XGF"
          ></script>
          <script>
            {`  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-QZ5KK79XGF');`}
          </script>

          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
          suppressHydrationWarning
        >
          {children}
        </body>
      </html>
    </NextIntlClientProvider>
  );
}
