import { S3Client } from "@aws-sdk/client-s3";
import cuid from "cuid";
import multer from "multer";
import multerS3 from "multer-s3";
import dotenv from "dotenv";
dotenv.config();
import { prisma } from "#prisma";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
});

export const rawUpload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET,
    key: (req, file, cb) => {
      cb(null, `${process.env.PROJECT_NAME}/${cuid()}_${file.originalname}`);
    },
    acl: "public-read",
  }),
});

export const upload =
  ({
    fieldName = "files",
    maxFileSize = 5 * 1024 * 1024, // Default 5MB
    allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"],
  } = {}) =>
  (req, res, next) => {
    const dynamicUpload = multer({
      storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET,
        key: (req, file, cb) => {
          cb(
            null,
            `${process.env.PROJECT_NAME}/${cuid()}_${file.originalname}`
          );
        },
        acl: "public-read",
      }),
      limits: { fileSize: maxFileSize },
      fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          return cb(
            new Error(
              `Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`
            )
          );
        }
      },
    });

    dynamicUpload.single(fieldName)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }

      try {
        const { originalname, mimetype, size, location, key, contentType } =
          req.file;
        const userId = req.user?.id || null;

        req.fileLog = await prisma.file.create({
          data: {
            userId,
            key,
            originalname,
            mimetype,
            contentType: contentType || mimetype,
            size,
            location,
          },
        });

        next();
      } catch (error) {
        console.error("Error logging file upload:", error);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });
  };
