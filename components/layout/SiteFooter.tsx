"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ExternalLink,
  Globe,
  House,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { GithubIcon, InstagramIcon } from "@/components/icons/BrandIcons";
import { CONTACT_EMAIL } from "@/lib/contactEmail";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { MAIN_HOSTNAMES, MAIN_SITE_URL, siteConfig } from "@/lib/siteConfig";

const SDG_GOALS = [
  { id: "1", label: "UN Sustainable Development Goal 1: No Poverty" },
  { id: "2", label: "UN Sustainable Development Goal 2: Zero Hunger" },
  { id: "3", label: "UN Sustainable Development Goal 3: Good Health and Well-being" },
  { id: "10", label: "UN Sustainable Development Goal 10: Reduced Inequalities" },
] as const;

const INSTAGRAM_URL =
  "https://www.instagram.com/help.nearby1?igsh=MWx4ZzYxMnA2MXR5Mg%3D%3D&utm_source=qr";
const UN_SDG_URL = "https://sdgs.un.org/partnerships/helpnearby";
const SITE_URL = siteConfig.url;
const GITHUB_URL = siteConfig.footerLinkUrl;

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-label="love" role="img">
      <path d="M12 21s-6.7-4.35-9.33-8.07C.9 10.3 1.66 6.6 4.9 5.7c1.94-.54 3.86.32 4.96 1.9L12 9.2l2.14-1.6c1.1-1.58 3.02-2.44 4.96-1.9 3.24.9 4 4.6 2.23 7.23C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

/** Mandatory credit on every copy. It is not configurable. */
function PoweredBy({ language }: { language: string }) {
  return (
    <p className="made" data-testid="footer-powered-by">
      {language === "ru" ? "Работает на " : "Powered by "}
      <a href={`${MAIN_SITE_URL}/`} target="_blank" rel="noopener">
        HelpNearby
      </a>
    </p>
  );
}

function instagramHref(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://www.instagram.com/${value.replace(/^@/, "")}`;
}

/** Footer of a copy: no main-site contacts, partners, SDG block or review/submit links. */
function CopySiteFooter() {
  const { t, language } = useLanguage();
  const { operatorName, instagram, contactEmail } = siteConfig;

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <BrandLogo barId="hn-bar-footer" />
            <span>{siteConfig.name}</span>
          </Link>
          <p>{t("footerTagline")}</p>
        </div>

        <div>
          <h4>{t("footerQuickLinks")}</h4>
          <ul>
            <li>
              <Link href="/">
                <House className="ui-icon" aria-hidden />
                {t("navHome")}
              </Link>
            </li>
            <li>
              <Link href="/about">
                <BookOpen className="ui-icon" aria-hidden />
                {t("navAbout")}
              </Link>
            </li>
            <li>
              <Link href="/privacy">
                <ShieldCheck className="ui-icon" aria-hidden />
                {t("navPrivacy")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>{t("footerContact")}</h4>
          <div className="contact-list">
            {instagram ? (
              <a className="contact-btn" href={instagramHref(instagram)} target="_blank" rel="noopener noreferrer">
                <InstagramIcon className="ui-icon" aria-hidden />
                {instagram.startsWith("http") ? "Instagram" : `@${instagram.replace(/^@/, "")}`}
              </a>
            ) : null}
            {contactEmail ? (
              <a className="contact-btn" href={`mailto:${contactEmail}`} data-testid="footer-contact-email">
                <Mail className="ui-icon" aria-hidden />
                {contactEmail}
              </a>
            ) : null}
            <a className="contact-btn" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GithubIcon className="ui-icon" aria-hidden />
              {t("footerGitHub")}
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        {operatorName ? <p>{`© ${new Date().getFullYear()} ${operatorName}`}</p> : null}
        <PoweredBy language={language} />
      </div>
    </footer>
  );
}

export function SiteFooter() {
  const { t, language } = useLanguage();
  // The authorship credit is not configurable. Copies are detected by hostname as well as by
  // NEXT_PUBLIC_SITE_URL, so a copy that never set the latter still shows it after hydration.
  const [isMainSite, setIsMainSite] = useState(siteConfig.url === MAIN_SITE_URL);
  useEffect(() => {
    setIsMainSite(MAIN_HOSTNAMES.has(window.location.hostname));
  }, []);
  const [shareCopied, setShareCopied] = useState(false);

  const copyShareLink = useCallback(async () => {
    const text = `${t("footerShareText")} ${SITE_URL}`;
    await navigator.clipboard.writeText(text);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  }, [t]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "Help Nearby",
      text: t("footerShareText"),
      url: SITE_URL,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    await copyShareLink();
  }, [copyShareLink, t]);

  if (siteConfig.isCopy) return <CopySiteFooter />;

  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <BrandLogo barId="hn-bar-footer" />
            <span>{t("brand")}</span>
          </Link>
          <p>{t("footerTagline")}</p>
        </div>

        <div>
          <h4>{t("footerQuickLinks")}</h4>
          <ul>
            <li>
              <Link href="/">
                <House className="ui-icon" aria-hidden />
                {t("navHome")}
              </Link>
            </li>
            <li>
              <Link href="/why-it-matters">
                <Target className="ui-icon" aria-hidden />
                {t("navWhy")}
              </Link>
            </li>
            <li>
              <Link href="/about">
                <BookOpen className="ui-icon" aria-hidden />
                {t("navAbout")}
              </Link>
            </li>
            <li>
              <Link href="/reviews">
                <MessageSquare className="ui-icon" aria-hidden />
                {t("navReviewsShort")}
              </Link>
            </li>
            <li>
              <Link href="/recent">
                <Clock className="ui-icon" aria-hidden />
                {t("navRecent")}
              </Link>
            </li>
            <li>
              <Link href="/submit">
                <Plus className="ui-icon" aria-hidden />
                {t("footerSubmitOrg")}
              </Link>
            </li>
            <li>
              <Link href="/privacy">
                <ShieldCheck className="ui-icon" aria-hidden />
                {t("navPrivacy")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>{t("footerContact")}</h4>
          <div className="contact-list">
            <a className="contact-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <InstagramIcon className="ui-icon" aria-hidden />
              {t("footerInstagram")}
            </a>
            <a className="contact-btn" href={`mailto:${CONTACT_EMAIL}`} data-testid="footer-contact-email">
              <Mail className="ui-icon" aria-hidden />
              {CONTACT_EMAIL}
            </a>
            <button type="button" className="contact-btn" onClick={() => void handleShare()}>
              <Share2 className="ui-icon" aria-hidden />
              {shareCopied ? t("footerShareCopied") : t("footerShareProject")}
            </button>
            <a className="contact-btn" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GithubIcon className="ui-icon" aria-hidden />
              {t("footerGitHub")}
            </a>
            <a className="contact-btn" href={UN_SDG_URL} target="_blank" rel="noopener noreferrer">
              <Globe className="ui-icon" aria-hidden />
              {t("footerUnSdg")}
            </a>
            <p className="partner-label">{t("footerOurPartner")}</p>
            <a className="contact-btn" href="https://t.me/kindnesscorp" target="_blank" rel="noopener noreferrer">
              <Send className="ui-icon" aria-hidden />
              {t("footerTelegram")}
            </a>
            <a className="contact-btn" href="https://www.kindnesscorporation.ru/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="ui-icon" aria-hidden />
              {t("footerWebsite")}
            </a>
            <p className="partner-name">{t("footerPartnerName")}</p>
          </div>
        </div>
      </div>

      <div className="sdg-block">
        <h4 className="sdg-heading">{t("footerSdgHeading")}</h4>
        <div className="sdg-row">
          {SDG_GOALS.map((goal) => (
            <Image
              key={goal.id}
              src={`/images/sdg/${goal.id}.png`}
              alt={goal.label}
              width={152}
              height={152}
              quality={100}
              className="sdg-img"
            />
          ))}
        </div>
        <p className="small">{t("footerSdgDisclaimer")}</p>
      </div>

      <div className="footer-bottom">
        <p>{t("footerCopyright")}</p>
        <p className="made">
          {t("footerMadeWith")}{" "}
          <span className="heart-red">
            <HeartIcon />
          </span>
          {" "}{t("footerForCommunities")}
        </p>
        {isMainSite ? null : <PoweredBy language={language} />}
      </div>
    </footer>
  );
}
