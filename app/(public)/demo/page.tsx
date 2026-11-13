import type { Metadata } from "next";
import { DemoWalkthrough } from "./demo-walkthrough";

export const metadata: Metadata = {
  title: { absolute: "Wilderness Farms" },
  appleWebApp: {
    capable: true,
    title: "Wilderness Farms",
  },
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <DemoWalkthrough />;
}
