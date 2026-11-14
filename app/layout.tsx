import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const title = "Wilderness Farms | Fresh Local Egg Delivery in Ponte Vedra Beach";
const description =
  "Discover Wilderness Farms, bringing fresh, locally raised eggs to Ponte Vedra Beach. Join our early access list for deliveries expected March 2027.";

export const metadata: Metadata = {
  metadataBase: new URL("https://wildernesseggs.com"),
  title: {
    default: title,
    template: "%s · Wilderness Farms",
  },
  applicationName: "Wilderness Farms",
  description,
  appleWebApp: {
    capable: true,
    title: "Wilderness Farms",
    statusBarStyle: "default",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title,
    description,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/photos/hero-carton.jpg",
        width: 1200,
        height: 900,
        alt: "Brown and cream eggs in an open carton",
      },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full bg-cream font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
