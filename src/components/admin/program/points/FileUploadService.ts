
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

/**
 * Uploads files to Supabase storage and returns an array of public URLs
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `program_points/${fileName}`;

    console.log(`[FileUploadService] Uploading file: ${filePath}`);

    const { data, error } = await supabase.storage
      .from('program_files')
      .upload(filePath, file);

    if (error) {
      console.error("[FileUploadService] File upload error:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('program_files')
      .getPublicUrl(filePath);

    console.log(`[FileUploadService] File uploaded successfully. Public URL: ${publicUrl}`);
    return publicUrl;
  });

  return (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];
}

/**
 * Uploads a single image to Supabase storage and returns the public URL
 */
export async function uploadProgramImage(file: File): Promise<string | null> {
  if (!file) {
    console.log("[FileUploadService] No file provided for upload");
    return null;
  }

  try {
    console.log(`[FileUploadService] Starting image upload for: ${file.name}`);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `program_images/${fileName}`;

    console.log(`[FileUploadService] Uploading to path: ${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from('program_images')
      .upload(filePath, file);

    if (uploadError) {
      console.error("[FileUploadService] Image upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('program_images')
      .getPublicUrl(filePath);

    console.log(`[FileUploadService] Image upload successful. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("[FileUploadService] Image upload exception:", error);
    return null;
  }
}
