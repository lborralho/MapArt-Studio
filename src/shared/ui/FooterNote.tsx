import { CONTACT_EMAIL, LEGAL_NOTICE_URL, PRIVACY_URL } from "@/core/config";

export default function FooterNote() {
  const appVersion = String(import.meta.env.VITE_APP_VERSION ?? "0.0.0").trim();
  const contactEmail = String(CONTACT_EMAIL ?? "").trim();
  const legalNoticeUrl = String(LEGAL_NOTICE_URL ?? "").trim();
  const privacyUrl = String(PRIVACY_URL ?? "").trim();
  const hasLegal = Boolean(contactEmail || legalNoticeUrl || privacyUrl);

  return (
    <footer className="app-footer desktop-footer">
      <div className="desktop-footer-left">
        {hasLegal ? (
          <p className="source-note">
            {contactEmail && (
              <a className="source-link" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            )}
            {contactEmail && (legalNoticeUrl || privacyUrl) && " | "}
            {legalNoticeUrl && (
              <a
                className="source-link"
                href={legalNoticeUrl}
                target="_blank"
                rel="noreferrer"
              >
                Imprint
              </a>
            )}
            {legalNoticeUrl && privacyUrl && " | "}
            {privacyUrl && (
              <a
                className="source-link"
                href={privacyUrl}
                target="_blank"
                rel="noreferrer"
              >
                Data Privacy
              </a>
            )}
          </p>
        ) : null}
      </div>

      <div className="desktop-footer-middle">
        <p className="made-note">
          MapArt v{appVersion} | © 2026 | Made with{" "}
          <span className="heart">❤︎</span> in Hannover, Germany
        </p>
      </div>

      <div className="desktop-footer-right" />
    </footer>
  );
}
