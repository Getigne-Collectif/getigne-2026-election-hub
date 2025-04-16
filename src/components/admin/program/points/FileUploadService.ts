
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

    const { data, error } = await supabase.storage
      .from('program_files')
      .upload(filePath, file);

    if (error) {
      console.error("File upload error:", error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('program_files')
      .getPublicUrl(filePath);

    return publicUrl;
  });

  return (await Promise.all(uploadPromises)).filter(url => url !== null) as string[];
}

/**
 * Uploads a single image to Supabase storage and returns the public URL
 */
export async function uploadProgramImage(file: File): Promise<string | null> {
  if (!file) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `sections/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('program_images')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('program_images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Image upload error:", error);
    return null;
  }
}
