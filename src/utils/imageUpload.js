import ImageKit from "imagekit";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT,
});

async function uploadImage(fileBuffer, originalname, folder = "images") {
  try {
    if (!fileBuffer || !originalname) {
      throw new Error("Missing file buffer or original file name");
    }
    const result = await imageKit.upload({
      file: fileBuffer,
      fileName: Date.now() + "-" + originalname,
      folder: folder,
    });
    console.log("UPLOAD SUCCESS:", {
      fileId: result.fileId,
      url: result.url,
      name: result.name,
    });
    return result;
  } catch (err) {
    console.error("UPLOAD FAILED:", err && err.message ? err.message : err);
    throw err;
  }
}

async function deleteImage(fileId) {
  if (!fileId) {
    throw new Error("FileId is required for deletion");
  }
  try {
    const res = await imageKit.deleteFile(fileId);
    console.log("DELETE SUCCESS:", { fileId: fileId });
    return res;
  } catch (err) {
    console.error("DELETE FAILED:", err && err.message ? err.message : err);
    throw err;
  }
}

export { uploadImage, deleteImage };
