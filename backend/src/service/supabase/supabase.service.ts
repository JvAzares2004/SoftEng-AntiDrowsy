import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables:', {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!supabaseKey,
      });
      throw new Error(
        'Supabase URL and key are required. Check your .env file.',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async uploadFile(
    bucket: string,
    filePath: string,
    file: Buffer,
    contentType?: string,
  ): Promise<{ url: string; path: string }> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } =
        await this.supabase.storage.listBuckets();
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      const bucketExists = buckets.some((b) => b.name === bucket);
      if (!bucketExists) {
        throw new Error(
          `Bucket '${bucket}' does not exist. Please create it manually in your Supabase dashboard and make it public.`,
        );
      }

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: contentType || 'application/octet-stream',
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const { data: publicUrlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { url: publicUrlData.publicUrl, path: data.path };
    } catch (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async listFiles(bucket: string, folder?: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Supabase list error:', error);
      throw error;
    }
  }
}
