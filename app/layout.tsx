import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: {
    default: "BookScore DFW — Book Distribution Dashboard",
    template: "%s · BookScore DFW",
  },
  description:
    "A joyful seva platform for tracking book distribution across the DFW devotee community.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <SiteNav />
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:pb-12">
          {children}
        </main>
        <footer className="border-t py-6 pb-24 text-center text-xs text-muted-foreground md:pb-6">
          Hare Krishna 🙏 Built with love for the DFW devotee community
        </footer>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
