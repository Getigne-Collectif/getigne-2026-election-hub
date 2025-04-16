import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      console.error("[FileUploadService] File upload error:", error);
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
 * Uploads a single image to Supabase storage specifically for program sections
 * and returns the public URL
 */
export async function uploadProgramImage(file: File): Promise<string | null> {
  if (!file) return null;

  try {
    // Validate file type
    const fileType = file.type.toLowerCase();
    if (!fileType.startsWith('image/')) {
      toast.error("Seules les images peuvent être téléchargées");
      return null;
    }
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const uniqueId = uuidv4();
    const fileName = `program_section_${uniqueId}.${fileExt}`;
    const filePath = `program_images/${fileName}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('program_files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      toast.error(`Erreur lors de l'upload: ${uploadError.message}`);
      return null;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('program_files')
      .getPublicUrl(filePath);

    toast.success("Image téléchargée avec succès");
    return publicUrl;
  } catch (error) {
    toast.error(`Erreur lors de l'upload: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
