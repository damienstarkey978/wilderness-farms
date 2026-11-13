import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import { connection } from "next/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getFarm } from "@/lib/db";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const body = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "Wilderness Farms",
    template: "%s · Wilderness Farms",
  },
  description: "Organic eggs delivered in Ponte Vedra Beach, Florida. $10 a dozen, Monday through Saturday.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  const greenlit = getFarm().getGreenlit();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <SiteHeader greenlit={greenlit} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
