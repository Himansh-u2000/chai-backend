import dotenv from "dotenv"
dotenv.config({
  path: "./.env"
});
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadFileOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });
    // console.log("File Uploaded on Cloudinary successfully : ", response.url);
    fs.unlinkSync(localFilePath)
    return response;
  } catch (error) {
    if (fs.existsSync(localFilePath)) { fs.unlinkSync(localFilePath); }
    return null;
  }
}

export { uploadFileOnCloudinary };
