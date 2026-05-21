import { SiteLayout } from "@/components/layout/SiteLayout";

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout>{children}</SiteLayout>;
}
