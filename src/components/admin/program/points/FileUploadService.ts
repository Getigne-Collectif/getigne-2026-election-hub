
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
