import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const idProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nexus_id_proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  } as any,
});

export const uploadIdProof = multer({ storage: idProofStorage });

const completionReportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nexus_completion_reports',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  } as any,
});

export const uploadCompletionImages = multer({ storage: completionReportStorage, limits: { fileSize: 10 * 1024 * 1024 } });
