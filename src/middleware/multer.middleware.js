import { unlinkSync } from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../public");
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const deleteLocalFile = async (filePath) => {
  try {
    unlinkSync(filePath);
  } catch (error) {
    console.error("Failed To Delete Local File");
  }
};

export const upload = multer({ storage });
