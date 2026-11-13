import type { Metadata } from "next";
import { DemoWalkthrough } from "./demo-walkthrough";

export const metadata: Metadata = {
  title: "Sunday demo",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <DemoWalkthrough />;
}
