import type { Metadata } from "next";
import { Fraunces, Inter, Nunito_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const body = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const app = Inter({
  subsets: ["latin"],
  variable: "--font-app",
});

export const metadata: Metadata = {
  title: {
    default: "Wilderness Farms",
    template: "%s · Wilderness Farms",
  },
  description: "Organic eggs delivered in Ponte Vedra Beach, Florida. $10 a dozen, Monday through Saturday.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${app.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
