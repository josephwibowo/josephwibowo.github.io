import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
