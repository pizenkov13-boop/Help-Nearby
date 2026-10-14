import { SiteLayout } from "@/components/layout/SiteLayout";

export default function RecentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout>{children}</SiteLayout>;
}
