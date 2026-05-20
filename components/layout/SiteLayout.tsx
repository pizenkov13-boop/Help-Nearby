"use client";

import { ChatWidget } from "@/components/ChatWidget";
import { Header } from "@/components/Header";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SiteFooter } from "./SiteFooter";

interface SiteLayoutProps {
  children: React.ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const { dir } = useLanguage();

  return (
    <div dir={dir} className="flex min-h-screen flex-col bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
      <Header />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ChatWidget />
    </div>
  );
}
