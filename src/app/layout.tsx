import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://josephwibowo.github.io"),
  title: "Joseph Wibowo | Builder overwhelmed at the possibilities",
  description:
    "Builder overwhelmed at the possibilities. A data engineer building Stoke Money, a personal finance app, in a scale-model office full of other people's stories.",
  openGraph: {
    type: "website",
    siteName: "Joseph Wibowo",
    title: "Joseph Wibowo | Builder overwhelmed at the possibilities",
    description:
      "A data engineer building Stoke Money, a personal finance app, in a scale-model office full of other people's stories.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joseph Wibowo | Builder overwhelmed at the possibilities",
    description:
      "A data engineer building Stoke Money, a personal finance app, in a scale-model office full of other people's stories.",
  },
  verification: {
    google: "JGn4Y3QSXAhqwi08hmYTcDi7f6VCPuSJzqUvfzYWVv0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
