"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const INSTAGRAM_URL =
  "https://www.instagram.com/help.nearby1?igsh=MWx4ZzYxMnA2MXR5Mg%3D%3D&utm_source=qr";

function TelegramIcon() {
  return (
    <svg className="tg-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <BrandLogo barId="hn-bar2" heartId="hn-heart2" />
            <span>Help Nearby</span>
          </Link>
          <p>Connecting people to the help they need. Fast, free, accessible.</p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link href="/">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
                </svg>
                Home
              </Link>
            </li>
            <li>
              <Link href="/why-it-matters">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                </svg>
                Why It Matters
              </Link>
            </li>
            <li>
              <Link href="/about">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
                  <path d="M6 12h12M6 16h12M6 8h12" />
                </svg>
                About Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <div className="contact-list">
            <a
              className="contact-btn"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Inst: @help.nearby1
            </a>
            <p className="partner-label">Our Partner</p>
            <a
              className="contact-btn"
              href="https://t.me/kindnesscorp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <TelegramIcon />
              tg: The Kindness Corp.
            </a>
            <a
              className="contact-btn"
              href="https://www.kindnesscorporation.ru/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web: kindnesscorporation.ru
            </a>
            <p className="partner-name">The Kindness Co.</p>
          </div>
        </div>
      </div>

      <div className="sdg-block">
        <div className="sdg-row">
          <div className="sdg-tile sdg-1">
            <div className="num">1</div>
            <div className="label">No Poverty</div>
          </div>
          <div className="sdg-tile sdg-2">
            <div className="num">2</div>
            <div className="label">Zero Hunger</div>
          </div>
          <div className="sdg-tile sdg-3">
            <div className="num">3</div>
            <div className="label">Good Health</div>
          </div>
          <div className="sdg-tile sdg-10">
            <div className="num">10</div>
            <div className="label">Reduced Inequalities</div>
          </div>
        </div>
        <p>Our mission is aligned with UN Sustainable Development Goals</p>
        <p className="small">
          This website is an independent initiative and is not an official organ
          of the United Nations.
        </p>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Help Nearby · Helping find assistance worldwide</p>
        <p className="made">
          Made with <span className="heart-red">❤️</span> for communities in need
        </p>
      </div>
    </footer>
  );
}
