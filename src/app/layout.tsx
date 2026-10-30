import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FunnelOS", template: "%s · FunnelOS" },
  description: "Gestão de quizzes e funis de vendas",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: "text-[13px]" }} />
      </body>
    </html>
  );
}
