// src/libs/supabaseStorage.ts
import { v4 as uuidv4 } from "uuid";

import { supabase } from "./supabaseClient";

// Single public bucket for all user media (memory images/videos/voice +
// profile photos). Folders namespace the content.
export const MEDIA_BUCKET = "media";

const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

/** Upload a file to the media bucket and return its public URL. */
export async function uploadMedia(
  file: File,
  folder: string,
  contentType?: string,
): Promise<string> {
  const path = `${folder}/${uuidv4()}-${sanitize(file.name)}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      contentType: contentType || file.type || undefined,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

/** Best-effort delete of a media file given its public URL. */
export async function deleteMediaByUrl(url?: string | null): Promise<void> {
  if (!url) return;

  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);

  if (i === -1) return;

  const path = decodeURIComponent(url.slice(i + marker.length));

  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}
