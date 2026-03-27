const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

const SPOT_IMAGE_BUCKET = "spots";

export function resolveImageUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const path = raw.startsWith("/") ? raw.slice(1) : raw;
  return `${SUPABASE_URL}/storage/v1/object/public/${SPOT_IMAGE_BUCKET}/${path}`;
}
