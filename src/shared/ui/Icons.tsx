// Icon re-exports backed by react-icons.
// Import from this module to stay decoupled from the underlying icon library.

export { FaGithub as GitHubIcon } from "react-icons/fa";
export { FaStar as StarIcon } from "react-icons/fa";
export { FaLinkedin as LinkedInIcon } from "react-icons/fa";
export { FaInstagram as InstagramIcon } from "react-icons/fa";
export { FaRedditAlien as RedditIcon } from "react-icons/fa";
export { FaYoutube as YouTubeIcon } from "react-icons/fa";
export { FaThreads as ThreadsIcon } from "react-icons/fa6";
export { FaCheck as CheckIcon } from "react-icons/fa";
export { FaMugHot as CoffeeIcon } from "react-icons/fa";
export { SiKofi as KofiIcon } from "react-icons/si";
export { FiDownload as DownloadIcon } from "react-icons/fi";
export { FiLoader as LoaderIcon } from "react-icons/fi";
export { FaEdit as EditIcon } from "react-icons/fa";
export { FaTrashCan as TrashIcon } from "react-icons/fa6";
export { GoZoomIn as PlusIcon } from "react-icons/go";
export { GoZoomOut as MinusIcon } from "react-icons/go";
export { FaRegCircleCheck as FinishIcon } from "react-icons/fa6";
export { FiLock as LockIcon } from "react-icons/fi";
export { FiUnlock as UnlockIcon } from "react-icons/fi";
export { FiSettings as SettingsIcon } from "react-icons/fi";
export { FaGear as GearIcon } from "react-icons/fa6";
export { MdOutlineFilterCenterFocus as RecenterIcon } from "react-icons/md";
export { FiRotateCw as RotateIcon } from "react-icons/fi";
export { FiRotateCcw as RotateLeftIcon } from "react-icons/fi";
export { FiRotateCw as RotateRightIcon } from "react-icons/fi";
export { MdMyLocation as MyLocationIcon } from "react-icons/md";
export { FiMapPin as LocationIcon } from "react-icons/fi";
export { FiDroplet as ThemeIcon } from "react-icons/fi";
export { FiMaximize as RatioIcon } from "react-icons/fi";
export { FiType as StyleIcon } from "react-icons/fi";
export { FiInfo as InfoIcon } from "react-icons/fi";
export { FiLayers as LayersIcon } from "react-icons/fi";
export { BsPinMap as MarkersIcon } from "react-icons/bs";
export { BsChevronCompactLeft as ChevronCompactLeftIcon } from "react-icons/bs";
export { BsChevronCompactRight as ChevronCompactRightIcon } from "react-icons/bs";
export { FiChevronDown as ChevronDownIcon } from "react-icons/fi";
export { FiX as CloseIcon } from "react-icons/fi";
export { FiMonitor as MonitorIcon } from "react-icons/fi";
export { FiSearch as SearchIcon } from "react-icons/fi";
export { FiLayout as DesignIcon } from "react-icons/fi";

/* ── Alignment icons (Figma-style, inline SVG) ── */

export function AlignLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1.5" y="2.5" width="1.5" height="11" rx="0.5" opacity="0.45" />
      <rect x="4" y="3.5" width="9" height="3.5" rx="1" />
      <rect x="4" y="9" width="6" height="3" rx="1" opacity="0.65" />
    </svg>
  );
}

export function AlignCenterHIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="7.25" y="2.5" width="1.5" height="11" rx="0.5" opacity="0.45" />
      <rect x="2.5" y="3.5" width="11" height="3.5" rx="1" />
      <rect x="4" y="9" width="8" height="3" rx="1" opacity="0.65" />
    </svg>
  );
}

export function AlignRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="13" y="2.5" width="1.5" height="11" rx="0.5" opacity="0.45" />
      <rect x="3" y="3.5" width="9" height="3.5" rx="1" />
      <rect x="6" y="9" width="6" height="3" rx="1" opacity="0.65" />
    </svg>
  );
}

export function AlignTopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="1.5" width="11" height="1.5" rx="0.5" opacity="0.45" />
      <rect x="3.5" y="4" width="3.5" height="9" rx="1" />
      <rect x="9" y="4" width="3" height="6" rx="1" opacity="0.65" />
    </svg>
  );
}

export function AlignCenterVIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="7.25" width="11" height="1.5" rx="0.5" opacity="0.45" />
      <rect x="3.5" y="2.5" width="3.5" height="11" rx="1" />
      <rect x="9" y="4" width="3" height="8" rx="1" opacity="0.65" />
    </svg>
  );
}

export function AlignBottomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="13" width="11" height="1.5" rx="0.5" opacity="0.45" />
      <rect x="3.5" y="3" width="3.5" height="9" rx="1" />
      <rect x="9" y="6" width="3" height="6" rx="1" opacity="0.65" />
    </svg>
  );
}
