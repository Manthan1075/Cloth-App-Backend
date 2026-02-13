import ImageKit from "imagekit";

export async function uploadImage(fileBuffer, folder = "images") {
  const imageKit = new ImageKit({
    publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
    privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT,
  });

  try {
    const result = await imageKit.upload({
      file: fileBuffer,
      fileName: `${Date.now()}-${fileBuffer.originalname}`,
      folder: folder,
    });
    console.log("UPLOAD SUCCESS:", result);
    return result;
  } catch (err) {
    console.error("UPLOAD FAILED:", err.message);
    throw err;
  }
}
