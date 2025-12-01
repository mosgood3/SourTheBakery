import { NextRequest, NextResponse } from 'next/server';
import { compressImage, validateImageForCompression } from '@/app/lib/image-compression';
import { supabase } from '@/app/lib/supabase';

export const runtime = 'nodejs'; // Ensure Node.js runtime for Sharp

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'products';
    const maxWidth = parseInt(formData.get('maxWidth') as string || '1200');
    const quality = parseInt(formData.get('quality') as string || '85');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate image
    const validation = validateImageForCompression(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress image
    const compressed = await compressImage(buffer, maxWidth, quality);

    // Create unique filename with .webp extension
    const timestamp = Date.now();
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // Remove original extension
    const fileName = `${timestamp}_${originalName}.webp`;
    const filePath = `${folder}/${fileName}`;

    // Upload compressed image to Supabase
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, compressed.buffer, {
        contentType: 'image/webp',
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload image to storage' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // Return success with metadata
    return NextResponse.json({
      url: publicUrlData.publicUrl,
      fileName,
      width: compressed.width,
      height: compressed.height,
      originalSize: file.size,
      compressedSize: compressed.buffer.length,
      compressionRatio: ((1 - compressed.buffer.length / file.size) * 100).toFixed(1) + '%'
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process image upload' },
      { status: 500 }
    );
  }
}
