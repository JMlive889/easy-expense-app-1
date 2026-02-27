import { supabase } from '../supabase';

interface CacheEntry {
  url: string;
  expiresAt: number;
}

class SignedUrlCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly EXPIRY_BUFFER_MS = 10 * 60 * 1000;
  private readonly URL_VALIDITY_SECONDS = 3600;

  private getCacheKey(filePath: string): string {
    return `signed_url:${filePath}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() >= entry.expiresAt;
  }

  get(filePath: string): string | null {
    const key = this.getCacheKey(filePath);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.url;
  }

  set(filePath: string, url: string): void {
    const key = this.getCacheKey(filePath);
    const expiresAt = Date.now() + (this.URL_VALIDITY_SECONDS * 1000) - this.EXPIRY_BUFFER_MS;

    this.cache.set(key, {
      url,
      expiresAt,
    });
  }

  invalidate(filePath: string): void {
    const key = this.getCacheKey(filePath);
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  async generateOrGetCached(filePath: string, bucket: string = 'documents'): Promise<string | null> {
    const cached = this.get(filePath);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, this.URL_VALIDITY_SECONDS);

    if (error || !data?.signedUrl) {
      console.error(`Failed to generate signed URL for ${filePath}:`, error);
      return null;
    }

    this.set(filePath, data.signedUrl);
    return data.signedUrl;
  }

  async batchGenerateOrGetCached(
    filePaths: string[],
    bucket: string = 'documents'
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const pathsToFetch: string[] = [];

    for (const filePath of filePaths) {
      const cached = this.get(filePath);
      if (cached) {
        results.set(filePath, cached);
      } else {
        pathsToFetch.push(filePath);
      }
    }

    if (pathsToFetch.length === 0) {
      return results;
    }

    const fetchPromises = pathsToFetch.map(async (filePath) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, this.URL_VALIDITY_SECONDS);

      if (error || !data?.signedUrl) {
        console.error(`Failed to generate signed URL for ${filePath}:`, error);
        return { filePath, url: null };
      }

      this.set(filePath, data.signedUrl);
      return { filePath, url: data.signedUrl };
    });

    const fetchedResults = await Promise.all(fetchPromises);

    for (const result of fetchedResults) {
      if (result.url) {
        results.set(result.filePath, result.url);
      }
    }

    return results;
  }
}

export const signedUrlCache = new SignedUrlCache();
