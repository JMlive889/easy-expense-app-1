import { supabase } from './supabase';

export async function uploadEntityLogo(
  entityId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['png', 'jpg', 'jpeg', 'webp'];

    if (!fileExt || !allowedTypes.includes(fileExt)) {
      throw new Error('Invalid file type. Please upload a PNG, JPG, or WebP image.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB.');
    }

    const fileName = `${entityId}/logo.${fileExt}`;

    const { data: existingFiles } = await supabase.storage
      .from('entity-logos')
      .list(entityId);

    if (existingFiles && existingFiles.length > 0) {
      for (const existingFile of existingFiles) {
        await supabase.storage
          .from('entity-logos')
          .remove([`${entityId}/${existingFile.name}`]);
      }
    }

    const { data, error } = await supabase.storage
      .from('entity-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('entity-logos')
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Error uploading entity logo:', error);
    throw error;
  }
}

export async function deleteEntityLogo(entityId: string): Promise<void> {
  try {
    const { data: files } = await supabase.storage
      .from('entity-logos')
      .list(entityId);

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${entityId}/${file.name}`);
      await supabase.storage.from('entity-logos').remove(filePaths);
    }
  } catch (error) {
    console.error('Error deleting entity logo:', error);
    throw error;
  }
}

export async function updateEntityLogoUrl(
  entityId: string,
  logoUrl: string | null
): Promise<void> {
  const { error } = await supabase
    .from('entities')
    .update({ entity_logo_url: logoUrl })
    .eq('id', entityId);

  if (error) throw error;
}

export async function getEntityLogo(entityId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('entity_logo_url')
      .eq('id', entityId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching entity logo:', error);
      return null;
    }

    return getEntityLogoUrl(data.entity_logo_url);
  } catch (error) {
    console.error('Error in getEntityLogo:', error);
    return null;
  }
}

export function getEntityLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;

  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }

  const { data } = supabase.storage
    .from('entity-logos')
    .getPublicUrl(logoUrl);

  return data.publicUrl;
}
