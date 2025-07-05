import mongoose from "mongoose";
import {
  MONGODB_URI,
  DB_NAME
} from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`)
    console.log(`\nMongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
  } catch (error) {
    console.error("Error while connecting DB: ", error)
    process.exit(1)
  }
}

export default connectDB;