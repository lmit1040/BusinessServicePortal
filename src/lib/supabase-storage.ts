import { supabase } from './supabase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const uploadFileToSupabase = async (
  file: File,
  bucket: 'product-images' | 'product-videos',
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${timestamp}-${sanitizedFileName}`;

  if (onProgress) {
    onProgress({
      loaded: 0,
      total: file.size,
      percentage: 0,
    });
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase Storage Upload Error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  if (onProgress) {
    onProgress({
      loaded: file.size,
      total: file.size,
      percentage: 100,
    });
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

export const deleteFileFromSupabase = async (
  fileUrl: string,
  bucket: 'product-images' | 'product-videos'
): Promise<void> => {
  const fileName = fileUrl.split('/').pop();
  if (!fileName) {
    throw new Error('Invalid file URL');
  }

  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);

  if (error) {
    console.error('Supabase Storage Delete Error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

export const listFilesInSupabase = async (
  bucket: 'product-images' | 'product-videos'
): Promise<string[]> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list('', {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Supabase Storage List Error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }

  const files = data || [];

  return files
    .filter(file => file.name !== '.emptyFolderPlaceholder')
    .map((file) => {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(file.name);
      return urlData.publicUrl;
    });
};
