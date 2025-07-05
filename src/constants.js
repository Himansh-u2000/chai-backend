import dotenv from "dotenv"
dotenv.config({
  path: "./.env"
})

export const DB_NAME = "videotube"

// Default Temlate
export const PORT = process.env.PORT
export const CORS = process.env.CORS
export const MONGODB_URI = process.env.MONGODB_URI

// Token Data
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY

// Cloudinary constants
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET