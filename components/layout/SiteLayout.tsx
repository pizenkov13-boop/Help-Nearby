"use client";

import { ChatWidget } from "@/components/ChatWidget";
import { EmergencyHelp } from "@/components/EmergencyHelp";
import { BottomBar } from "@/components/layout/BottomBar";
import { Header } from "@/components/layout/Header";
import { ScrollToHash } from "@/components/layout/ScrollToHash";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { siteConfig } from "@/lib/siteConfig";
import { SiteFooter } from "./SiteFooter";

interface SiteLayoutProps {
  children: React.ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  const { dir } = useLanguage();

  return (
    <div
      dir={dir}
      className="has-bottom-bar flex min-h-screen flex-col bg-surface text-foreground transition-colors duration-300"
    >
      <Header />
      <ScrollToHash />
      <EmergencyHelp />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {siteConfig.chatEnabled ? <ChatWidget /> : null}
      <BottomBar />
    </div>
  );
}
