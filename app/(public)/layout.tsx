import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream text-ink [font-family:var(--font-app),Inter,ui-sans-serif,system-ui,sans-serif]">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
