"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { parseHashHref, scrollToSection } from "@/lib/scrollToSection";
import { cn } from "@/lib/utils";

interface AnchorNavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}

export function AnchorNavLink({
  href,
  className,
  children,
  onNavigate,
}: AnchorNavLinkProps) {
  const pathname = usePathname();
  const { path, hash } = parseHashHref(href);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();

    if (!hash) return;

    const targetPath = path === "" ? pathname : path;
    if (pathname === targetPath || (targetPath === "/" && pathname === "/")) {
      event.preventDefault();
      scrollToSection(hash);
      window.history.replaceState(null, "", `${targetPath}#${hash}`);
    }
  };

  return (
    <Link href={href} className={cn(className)} onClick={handleClick}>
      {children}
    </Link>
  );
}
