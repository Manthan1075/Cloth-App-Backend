import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const localUploadDir = path.join(backendRoot, "uploads");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 12000,
});

const saveLocally = async (file, folder) => {
  await fs.mkdir(localUploadDir, { recursive: true });
  const extension = path.extname(file.originalname || "").toLowerCase().replace(/[^.a-z0-9]/g, "") || ".jpg";
  const fileName = `${folder}-${randomUUID()}${extension}`;
  await fs.writeFile(path.join(localUploadDir, fileName), file.buffer);
  const baseUrl = (process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 6001}`).replace(/\/$/, "");
  return { fileId: `local:${fileName}`, url: `${baseUrl}/uploads/${fileName}`, name: path.basename(file.originalname || fileName, extension) };
};

export const uploadImage = async (file, folder = "images") => {
  try {
    if (!file) throw new Error("No file provided");
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error("File buffer is empty");
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });

    return {
      fileId: result.public_id,
      url: result.secure_url,
      name: result.original_filename,
    };
  } catch (error) {
    console.error("Cloud image upload unavailable; saving image locally:", error?.code || error?.message || error);
    try {
      return await saveLocally(file, folder);
    } catch (localError) {
      console.error("Local image upload failed:", localError?.message || localError);
      throw localError;
    }
  }
};

export const deleteImage = async (fileId) => {
  try {
    if (!fileId) throw new Error("File ID is required");

    if (fileId.startsWith("local:")) {
      await fs.unlink(path.join(localUploadDir, path.basename(fileId.slice(6)))).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
      return true;
    }

    await cloudinary.uploader.destroy(fileId);
    return true;
  } catch (error) {
    console.error("DELETE FAILED:", error.message);
    throw error;
  }
};

export const getCloudinaryPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) return null;

  const afterUpload = url.slice(uploadIndex + "/upload/".length);
  const withoutVersion = afterUpload.replace(/^v\d+\//, "");
  const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");

  return withoutExtension || null;
};
