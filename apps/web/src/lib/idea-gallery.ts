import {
  POST_TEMPLATE_CATEGORY_ORDER,
  type PostTemplateCategory,
} from "./post-templates";

export type IdeaGalleryCategory = PostTemplateCategory;

export const IDEA_GALLERY_CATEGORY_ORDER = POST_TEMPLATE_CATEGORY_ORDER;

export type IdeaGalleryImage = {
  id: string;
  category: IdeaGalleryCategory;
  /** Public URL under /gallery/… */
  src: string;
};

export const IDEA_GALLERY_IMAGES: IdeaGalleryImage[] = [
  { id: "eid-gold", category: "festival", src: "/gallery/festival/eid-gold.svg" },
  { id: "puja-lights", category: "festival", src: "/gallery/festival/puja-lights.svg" },
  { id: "pohela-red", category: "festival", src: "/gallery/festival/pohela-red.svg" },
  { id: "flash-red", category: "promo", src: "/gallery/promo/flash-red.svg" },
  { id: "weekend-blue", category: "promo", src: "/gallery/promo/weekend-blue.svg" },
  { id: "new-drop", category: "promo", src: "/gallery/promo/new-drop.svg" },
  { id: "cod-delivery", category: "ecommerce", src: "/gallery/ecommerce/cod-delivery.svg" },
  { id: "bkash-wallet", category: "ecommerce", src: "/gallery/ecommerce/bkash-wallet.svg" },
  { id: "giveaway", category: "engagement", src: "/gallery/engagement/giveaway.svg" },
  { id: "poll", category: "engagement", src: "/gallery/engagement/poll.svg" },
  { id: "open-hours", category: "general", src: "/gallery/general/open-hours.svg" },
  { id: "visit-us", category: "general", src: "/gallery/general/visit-us.svg" },
  { id: "bn-eid", category: "bangla", src: "/gallery/bangla/bn-eid.svg" },
  { id: "bn-nobo", category: "bangla", src: "/gallery/bangla/bn-nobo.svg" },
];

const galleryById = new Map(IDEA_GALLERY_IMAGES.map((image) => [image.id, image]));

export function getGalleryImagesByCategory(category: IdeaGalleryCategory) {
  return IDEA_GALLERY_IMAGES.filter((image) => image.category === category);
}

export function getGalleryImageById(id: string | null | undefined) {
  if (!id) return null;
  return galleryById.get(id) ?? null;
}

export function isGalleryCategory(value: string): value is IdeaGalleryCategory {
  return (IDEA_GALLERY_CATEGORY_ORDER as readonly string[]).includes(value);
}

export function normalizeGalleryImageId(id: string | null | undefined) {
  if (!id?.trim()) return null;
  const image = getGalleryImageById(id.trim());
  if (!image) {
    throw new Error("Unknown gallery image.");
  }
  return image.id;
}
