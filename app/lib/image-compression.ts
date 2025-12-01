import sharp from 'sharp';

// Configure Sharp for serverless/Vercel environment
// This prevents caching issues and ensures proper binary loading
if (process.env.VERCEL) {
  sharp.cache(false);
  sharp.simd(true);
}

export interface CompressedImageResult {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
}

/**
 * Compress an image using Sharp
 * Converts to WebP format and optimizes dimensions
 * @param buffer - Original image buffer
 * @param maxWidth - Maximum width (default: 1200px)
 * @param quality - WebP quality 1-100 (default: 85)
 */
export async function compressImage(
  buffer: Buffer,
  maxWidth: number = 1200,
  quality: number = 85
): Promise<CompressedImageResult> {
  try {
    console.log('Starting image compression...', { maxWidth, quality, bufferSize: buffer.length });

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    console.log('Image metadata:', metadata);

    // Calculate dimensions maintaining aspect ratio
    let width = metadata.width || maxWidth;
    let height = metadata.height || maxWidth;

    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
    }

    console.log('Target dimensions:', { width, height });

    // Compress and convert to WebP
    const compressed = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation (fixes sideways images from phones)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 6 }) // effort 6 = good balance of compression vs speed
      .toBuffer();

    console.log('Compression complete:', {
      originalSize: buffer.length,
      compressedSize: compressed.length,
      ratio: ((1 - compressed.length / buffer.length) * 100).toFixed(1) + '%'
    });

    return {
      buffer: compressed,
      contentType: 'image/webp',
      width,
      height,
    };
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple sizes of an image for responsive loading
 * Useful for product images, recipes, etc.
 */
export async function generateImageSizes(
  buffer: Buffer,
  quality: number = 85
): Promise<{
  thumbnail: CompressedImageResult;
  medium: CompressedImageResult;
  large: CompressedImageResult;
}> {
  const [thumbnail, medium, large] = await Promise.all([
    compressImage(buffer, 300, quality), // Thumbnail
    compressImage(buffer, 800, quality), // Medium
    compressImage(buffer, 1200, quality), // Large
  ]);

  return { thumbnail, medium, large };
}

/**
 * Convert a File object to Buffer (for server-side processing)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Validate image before compression
 */
export function validateImageForCompression(file: File): { valid: boolean; error?: string } {
  // Check file size (max 10MB before compression)
  const maxSizeBytes = 10 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'File size exceeds 10MB' };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Accepted: JPEG, PNG, WebP, GIF' };
  }

  return { valid: true };
}
