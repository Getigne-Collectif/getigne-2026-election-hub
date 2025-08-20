import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function downloadFileFromUrl(url: string, fileName?: string): Promise<void> {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const blob = await response.blob();
  const a = document.createElement('a');
  const blobUrl = window.URL.createObjectURL(blob);
  a.href = blobUrl;
  if (fileName) a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

export async function downloadFromSupabasePath(bucket: string, path: string, fileName?: string): Promise<void> {
  // Use the public URL approach if bucket is public; else use signed URL fetch
  const publicUrl = `https://jqpivqdwblrccjzicnxn.supabase.co/storage/v1/object/public/${bucket}/${path}`;
  return downloadFileFromUrl(publicUrl, fileName);
}
