"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
const SDG_GOALS = [
  { id: "sdg-1", label: "UN Sustainable Development Goal 1: No Poverty" },
  { id: "sdg-2", label: "UN Sustainable Development Goal 2: Zero Hunger" },
  { id: "sdg-3", label: "UN Sustainable Development Goal 3: Good Health and Well-being" },
  { id: "sdg-10", label: "UN Sustainable Development Goal 10: Reduced Inequalities" },
] as const;

const INSTAGRAM_URL =
  "https://www.instagram.com/help.nearby1?igsh=MWx4ZzYxMnA2MXR5Mg%3D%3D&utm_source=qr";

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

export function SiteFooter() {
  const { t } = useLanguage();

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
          </ul>
        </div>

        <div>
          <h4>{t("footerContact")}</h4>
          <div className="contact-list">
            <a className="contact-btn" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
              {t("footerInstagram")}
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={goal.id}
              src={`/images/sdg/${goal.id}.png`}
              alt={goal.label}
              width={76}
              height={76}
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
          {" "}for communities in need
        </p>
      </div>
    </footer>
  );
}
