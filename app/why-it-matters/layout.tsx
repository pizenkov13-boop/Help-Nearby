import { SiteLayout } from "@/components/layout/SiteLayout";

export default function WhyItMattersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteLayout>{children}</SiteLayout>;
}
