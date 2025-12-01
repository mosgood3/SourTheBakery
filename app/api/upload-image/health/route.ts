import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Test if Sharp is working by creating a simple 1x1 image
    const testBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .png()
    .toBuffer();

    return NextResponse.json({
      status: 'ok',
      sharp: {
        version: sharp.versions,
        working: true,
        testBufferSize: testBuffer.length
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        isVercel: !!process.env.VERCEL,
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      sharp: {
        working: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        isVercel: !!process.env.VERCEL,
      }
    }, { status: 500 });
  }
}
