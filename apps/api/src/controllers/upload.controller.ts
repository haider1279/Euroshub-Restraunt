import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { config } from '../config';

export const uploadDir = path.resolve(__dirname, '../../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `item-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

/**
 * Validates file magic bytes to verify genuine JPEG, PNG, or WebP signatures.
 */
export function verifyImageSignature(buffer: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WebP signature: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}

export const handleImageUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No image file uploaded.' } });
  }

  // 1. Verify genuine file magic bytes rather than trusting file.mimetype alone
  try {
    const headerBuffer = Buffer.alloc(16);
    const fd = fs.openSync(req.file.path, 'r');
    fs.readSync(fd, headerBuffer, 0, 16, 0);
    fs.closeSync(fd);

    const detectedType = verifyImageSignature(headerBuffer);
    if (!detectedType) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_SIGNATURE',
          message: 'Invalid file signature. Only genuine JPEG, PNG, and WebP images are permitted.',
        },
      });
    }
  } catch (err) {
    try {
      fs.unlinkSync(req.file.path);
    } catch {}
    return res.status(400).json({
      error: {
        code: 'FILE_READ_ERROR',
        message: 'Could not read uploaded file signature.',
      },
    });
  }

  // 2. In production, require Supabase Storage (local disk is ephemeral on cloud platforms like Render)
  if (config.nodeEnv === 'production') {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      return res.status(500).json({
        error: {
          code: 'STORAGE_CONFIGURATION_ERROR',
          message: 'Supabase Storage is required in production for persistent image uploads.',
        },
      });
    }
  }

  // 3. Attempt Supabase Storage upload when configured
  if (config.supabase.url && config.supabase.serviceRoleKey) {
    try {
      const bucket = config.supabase.storageBucketProducts || 'product-images';
      const uploadUrl = `${config.supabase.url}/storage/v1/object/${bucket}/${req.file.filename}`;
      const fileBuffer = fs.readFileSync(req.file.path);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
          apikey: config.supabase.serviceRoleKey,
          'Content-Type': req.file.mimetype,
          'x-upsert': 'true',
        },
        body: fileBuffer,
      });

      if (response.ok) {
        // Clean up local temp file once stored in Supabase
        try {
          fs.unlinkSync(req.file.path);
        } catch {}

        const publicUrl = `${config.supabase.url}/storage/v1/object/public/${bucket}/${req.file.filename}`;
        return res.status(201).json({
          url: publicUrl,
          filename: req.file.filename,
          size: req.file.size,
        });
      } else {
        const errText = await response.text();
        console.warn('Supabase storage upload error:', response.status, errText);
        if (config.nodeEnv === 'production') {
          try {
            fs.unlinkSync(req.file.path);
          } catch {}
          return res.status(502).json({
            error: {
              code: 'SUPABASE_UPLOAD_FAILED',
              message: `Failed to upload image to Supabase Storage: ${response.status}`,
            },
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to upload image to Supabase storage:', err);
      if (config.nodeEnv === 'production') {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
        return res.status(502).json({
          error: {
            code: 'SUPABASE_UPLOAD_FAILED',
            message: 'Failed to upload image to Supabase Storage.',
          },
        });
      }
    }
  }

  // 4. In development, fallback to local uploads disk
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
  });
};
