import { createServiceRoleClient, isSupabaseConfigured } from './supabase';

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'pdf-documents';

export interface UploadPdfResult {
  storagePath: string;
  publicUrl: string | null;
  signedUrl: string | null;
}

/**
 * Upload a PDF file buffer to Supabase Storage.
 *
 * Files are stored under `users/<userId>/<documentId>.pdf` so that:
 * - Each user's documents are namespaced.
 * - Row Level Security can be enforced via storage policies.
 */
export async function uploadPdfToStorage(
  userId: string,
  documentId: string,
  fileBuffer: Buffer,
  filename: string,
  bucket: string = DEFAULT_BUCKET
): Promise<UploadPdfResult> {
  if (!isSupabaseConfigured()) {
    return {
      storagePath: `local/${userId}/${documentId}.pdf`,
      publicUrl: null,
      signedUrl: null,
    };
  }

  const supabase = createServiceRoleClient();

  // Sanitize filename to avoid path traversal and special characters
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `users/${userId}/${documentId}.pdf`;

  const { data, error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
    contentType: 'application/pdf',
    upsert: true, // Allow re-uploads when a document is regenerated
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  // Generate a signed URL (valid for 1 hour) for private access
  const { data: signedData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60);

  return {
    storagePath: data.path,
    publicUrl: null,
    signedUrl: signedData?.signedUrl || null,
  };
}

/**
 * Create a signed URL for downloading a PDF from Supabase Storage.
 */
export async function createSignedPdfUrl(
  storagePath: string,
  bucket: string = DEFAULT_BUCKET,
  expiresIn: number = 60 * 60
): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error('Failed to create signed URL:', error.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete a PDF from Supabase Storage.
 */
export async function deletePdfFromStorage(
  storagePath: string,
  bucket: string = DEFAULT_BUCKET
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) {
    console.error('Failed to delete PDF from storage:', error.message);
  }
}