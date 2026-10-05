/**
 * Shared types used by the frontend, the admin panel and the API.
 * Everything the admin can edit lives in `SiteSettings` (stored as JSON rows
 * in the `settings` table) or `Product` (the `products` table).
 */

export type Size = "S" | "M" | "L" | "XL" | "XXL";
export const ALL_SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

export type Motif = "neon" | "rickshaw" | "wave" | "code" | "stripes" | "arch" | "none";
export const MOTIFS: Motif[] = ["neon", "rickshaw", "wave", "code", "stripes", "arch", "none"];

export type Product = {
  id: number;
  slug: string;
  name: string;
  combo: string;
  tagline: string;
  description: string;
  price: number;
  compareAt: number | null;
  category: string;
  fit: string;
  gsm: number;
  sizes: Size[];
  soldOut: Size[];
  badge: string;
  /** section background colour */
  bg: string;
  /** fabric colour */
  tee: string;
  ink: string;
  ink2: string;
  /** text colour on `bg` */
  fg: string;
  print: { title: string; sub: string; motif: Motif };
  /** uploaded front print (SVG/PNG) — replaces the coded motif when set */
  printUrl: string;
  /** uploaded back print (SVG/PNG) — replaces the coded spec label when set */
  backPrintUrl: string;
  /** uploaded .glb model — replaces the procedural tee when set */
  modelUrl: string;
  /** model scale multiplier / Y rotation offset (deg) for uploaded GLBs */
  modelScale: number;
  modelRotY: number;
  /** image shown behind the tee (product page + profile/benefit sections) */
  bgImageUrl: string;
  /** gallery images for the product page */
  gallery: string[];
  published: boolean;
  sortOrder: number;
};

export type BenefitIcon = "weight" | "ink" | "layers" | "ruler";
export const BENEFIT_ICONS: BenefitIcon[] = ["weight", "ink", "layers", "ruler"];

export type Link = { label: string; href: string };

export type SectionId = "carousel" | "profile" | "benefits" | "argument" | "range" | "faq" | "last" | "join";
export const SECTION_IDS: SectionId[] = ["carousel", "profile", "benefits", "argument", "range", "faq", "last", "join"];

export type PoseKey =
  | "carousel"
  | "profile"
  | "benefit0"
  | "benefit1"
  | "benefit2"
  | "benefit3"
  | "argument"
  | "range"
  | "faq"
  | "last"
  | "join";
export const POSE_KEYS: PoseKey[] = ["carousel", "profile", "benefit0", "benefit1", "benefit2", "benefit3", "argument", "range", "faq", "last", "join"];

export type Pose = {
  hx: number; hy: number; hz: number;
  hrx: number; hry: number; hrz: number;
  hs: number;
  hero: number;
  ring: number;
  wave: number;
  ringLift: number;
  podium: number;
  neutral: number;
  glow: number;
  vivid: number;
  letters: number;
  icons: number;
  argText: number;
};

export type SiteSettings = {
  brand: {
    name: string;
    subline: string;
    logoUrl: string;
    faviconUrl: string;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    city: string;
    copyright: string;
  };
  seo: { title: string; description: string; ogImageUrl: string };
  theme: {
    background: string;
    accent: string;
    defaultModelUrl: string;
    loader: boolean;
    sound: boolean;
    ringCount: number;
  };
  nav: Link[];
  socials: Link[];
  legal: Link[];
  shipping: {
    insideDhaka: number;
    outsideDhaka: number;
    freeOver: number;
    insideLabel: string;
    outsideLabel: string;
    insideEta: string;
    outsideEta: string;
  };
  payments: { id: string; label: string; note: string; enabled: boolean }[];
  sections: { id: SectionId; enabled: boolean; bgImageUrl: string }[];
  carousel: { hint: string; showArrows: boolean; showPodiums: boolean; showSlider: boolean };
  profile: { primaryCta: string; secondaryCta: string; showLetters: boolean; useTagline: boolean };
  benefits: {
    items: { icon: BenefitIcon; iconUrl: string; no: string; title: string; text: string; stat: string }[];
  };
  argument: {
    text: string;
    intervalMs: number;
    mode: "products" | "color" | "image";
    color: string;
    imageUrl: string;
    showLabel: boolean;
  };
  range: { kicker: string; ctaLabel: string; ctaHref: string };
  faq: { heading: string; items: { q: string; a: string }[] };
  join: { heading: string; text: string; placeholder: string; button: string; note: string; success: string };
  shop: { title: string; kicker: string; marquee: string[] };
  poses: Partial<Record<PoseKey, Partial<Pose>>>;
};

export type SiteData = { settings: SiteSettings; products: Product[] };

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
