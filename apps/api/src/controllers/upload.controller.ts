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

export const handleImageUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No image file uploaded.' } });
  }

  // 1. Try Supabase Storage first for cloud CDN persistence
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
        const publicUrl = `${config.supabase.url}/storage/v1/object/public/${bucket}/${req.file.filename}`;
        return res.status(201).json({
          url: publicUrl,
          filename: req.file.filename,
          size: req.file.size,
        });
      } else {
        const errText = await response.text();
        console.warn('Supabase storage upload returned error, falling back to local:', response.status, errText);
      }
    } catch (err) {
      console.error('Failed to upload image to Supabase storage, falling back to local:', err);
    }
  }

  // 2. Fallback to local uploads path
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
  });
};
