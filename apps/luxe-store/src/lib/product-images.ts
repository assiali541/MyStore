import type { Product } from "@workspace/api-client-react";

const PRODUCT_IMAGE_FALLBACK = "https://placehold.co/600x800/E8E4DF/333333?text=Maison+Luxe";

type ProductWithLegacyImage = Product & {
  image?: unknown;
  images?: unknown;
};

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
}

function resolveImageUrl(image: string) {
  const trimmed = image.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const apiBaseUrl = getApiBaseUrl();
  if (trimmed.startsWith("/api/uploads/")) {
    return apiBaseUrl ? `${apiBaseUrl}${trimmed}` : trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return apiBaseUrl ? `${apiBaseUrl}/api${trimmed}` : `/api${trimmed}`;
  }

  return trimmed;
}

function parseImages(images: unknown) {
  if (Array.isArray(images)) {
    return images;
  }

  if (typeof images !== "string") {
    return [];
  }

  const trimmed = images.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [trimmed];
  } catch {
    return [trimmed];
  }
}

export function getProductImages(product: ProductWithLegacyImage | null | undefined) {
  const images = [
    ...parseImages(product?.images),
    ...(typeof product?.image === "string" ? [product.image] : []),
  ];

  const resolvedImages = images
    .filter((image): image is string => typeof image === "string")
    .map(resolveImageUrl)
    .filter((image): image is string => Boolean(image));

  return resolvedImages.length ? resolvedImages : [PRODUCT_IMAGE_FALLBACK];
}

export function getProductMainImage(product: ProductWithLegacyImage | null | undefined) {
  return getProductImages(product)[0];
}
