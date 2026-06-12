import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function avatarStoragePath(userId: string, ext: string) {
  return `${userId}/avatar.${ext}`;
}

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "Use JPG, PNG, WebP ou GIF.";
  if (file.size > MAX_AVATAR_BYTES) return "A imagem deve ter no máximo 2 MB.";
  return null;
}

export async function uploadUserAvatar(userId: string, file: File) {
  const validationError = validateAvatarFile(file);
  if (validationError) return { error: new Error(validationError), url: null as string | null };

  const ext = extensionFor(file);
  const path = avatarStoragePath(userId, ext);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError, url: null as string | null };

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("user_id", userId);

  return { error: profileError, url };
}

export async function removeUserAvatar(userId: string) {
  await Promise.all(
    ["jpg", "png", "webp", "gif"].map((ext) =>
      supabase.storage.from(AVATAR_BUCKET).remove([avatarStoragePath(userId, ext)])
    )
  );

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("user_id", userId);

  return { error };
}
