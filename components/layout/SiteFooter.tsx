"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const SDG_GOALS = [
  { id: "1", label: "UN Sustainable Development Goal 1: No Poverty" },
  { id: "2", label: "UN Sustainable Development Goal 2: Zero Hunger" },
  { id: "3", label: "UN Sustainable Development Goal 3: Good Health and Well-being" },
  { id: "10", label: "UN Sustainable Development Goal 10: Reduced Inequalities" },
] as const;

const INSTAGRAM_URL =
  "https://www.instagram.com/help.nearby1?igsh=MWx4ZzYxMnA2MXR5Mg%3D%3D&utm_source=qr";
const CONTACT_EMAIL = "contact@help-nearby.org";
const SITE_URL = "https://help-nearby.org";
const GITHUB_URL = "https://github.com/pizenkov13-boop/Help-Nearby";

function InstagramIcon() {
  return (
    <svg className="tg-icon ig-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.5" cy="6.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="tg-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-label="love" role="img">
      <path d="M12 21s-6.7-4.35-9.33-8.07C.9 10.3 1.66 6.6 4.9 5.7c1.94-.54 3.86.32 4.96 1.9L12 9.2l2.14-1.6c1.1-1.58 3.02-2.44 4.96-1.9 3.24.9 4 4.6 2.23 7.23C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="tg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="tg-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
                </svg>
                {t("navHome")}
              </Link>
            </li>
            <li>
              <Link href="/why-it-matters">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                </svg>
                {t("navWhy")}
              </Link>
            </li>
            <li>
              <Link href="/about">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
                  <path d="M6 12h12M6 16h12M6 8h12" />
                </svg>
                {t("navAbout")}
              </Link>
            </li>
            <li>
              <Link href="/reviews">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
                {t("navReviewsShort")}
              </Link>
            </li>
            <li>
              <Link href="/submit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t("footerSubmitOrg")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>{t("footerContact")}</h4>
          <div className="contact-list">
            <a className="contact-btn" href={`mailto:${CONTACT_EMAIL}`}>
              <EmailIcon />
              {CONTACT_EMAIL}
            </a>
            <a className="contact-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
              {t("footerInstagram")}
            </a>
            <button type="button" className="contact-btn" onClick={() => void handleShare()}>
              <ShareIcon />
              {shareCopied ? t("footerShareCopied") : t("footerShareProject")}
            </button>
            <a className="contact-btn" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <GitHubIcon />
              {t("footerGitHub")}
            </a>
            <p className="partner-label">{t("footerOurPartner")}</p>
            <a className="contact-btn" href="https://t.me/kindnesscorp" target="_blank" rel="noopener noreferrer">
              <TelegramIcon />
              {t("footerTelegram")}
            </a>
            <a className="contact-btn" href="https://www.kindnesscorporation.ru/" target="_blank" rel="noopener noreferrer">
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
      </div>
    </footer>
  );
}
