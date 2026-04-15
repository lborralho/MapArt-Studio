import { useRepoStars } from "@/shared/hooks/useRepoStars";
import {
  REPO_URL,
  REPO_API_URL,
  CONTACT_EMAIL,
  LEGAL_NOTICE_URL,
  PRIVACY_URL,
  SOCIAL_LINKEDIN,
  SOCIAL_INSTAGRAM,
  SOCIAL_REDDIT,
  SOCIAL_THREADS,
  SOCIAL_YOUTUBE,
  KOFI_URL,
} from "@/core/config";
import {
  GitHubIcon,
  StarIcon,
  CheckIcon,
  KofiIcon,
  LinkedInIcon,
  InstagramIcon,
  RedditIcon,
  ThreadsIcon,
  YouTubeIcon,
} from "./Icons";

/* ── sub-components ── */

function HelpUsGrowSection() {
  return (
    <section className="info-panel-section">
      <p className="hug-copy">
        Minimalist map art studio. Create and download high-quality map posters.
      </p>
    </section>
  );
}

/* ── main panel ── */

export default function InfoPanel() {
  const repoUrl = String(REPO_URL ?? "").trim();
  const { repoStars, repoStarsLoading } = useRepoStars(REPO_API_URL);

  return (
    <aside className="info-panel">
      <div className="info-panel-group">
        <HelpUsGrowSection />
      </div>
    </aside>
  );
}
