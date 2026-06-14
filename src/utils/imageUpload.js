import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    console.error("UPLOAD FAILED:", error.message);
    throw error;
  }
};

export const deleteImage = async (fileId) => {
  try {
    if (!fileId) throw new Error("File ID is required");

    await cloudinary.uploader.destroy(fileId);
    return true;
  } catch (error) {
    console.error("DELETE FAILED:", error.message);
    throw error;
  }
};
