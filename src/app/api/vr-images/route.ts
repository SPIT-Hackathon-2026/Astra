import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const destination = searchParams.get('destination');

    if (!destination) {
      return NextResponse.json({ error: 'Destination required' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const destDir = path.join(publicDir, destination.toLowerCase());

    if (!fs.existsSync(destDir)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(destDir);
    
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.avif', '.webp'].includes(ext);
    });

    const images = imageFiles.map(file => `/${destination.toLowerCase()}/${file}`);

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error reading VR images:', error);
    return NextResponse.json({ error: 'Failed to load images' }, { status: 500 });
  }
}