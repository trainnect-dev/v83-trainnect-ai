import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'File size should be less than 10MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type), {
      message: 'File type should be JPEG, PNG, WebP, or PDF',
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', {
      type: file.type,
      size: file.size,
      name: (formData.get('file') as File).name
    });

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      console.error('File validation failed:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    // Generate a unique filename to avoid conflicts
    const uniqueFilename = `${Date.now()}-${filename}`;

    try {
      console.log('Uploading to Vercel Blob:', {
        filename: uniqueFilename,
        contentType: file.type,
        size: fileBuffer.byteLength
      });

      const data = await put(uniqueFilename, fileBuffer, {
        access: 'public',
        contentType: file.type, // Ensure content type is preserved
      });

      console.log('Upload successful:', data);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Blob upload failed:', error);
      return NextResponse.json({ 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : String(error) 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Request processing failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    );
  }
}
