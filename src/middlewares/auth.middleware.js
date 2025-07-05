import { ACCESS_TOKEN_SECRET } from "../constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken

    if (!token) {
      throw new ApiError(401, "Unauthorised Request in token")
    }
    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET)

    const user = await User?.findById(decodedToken._id).select("-password -refreshToken")

    if (!user) throw new ApiError(401, "Invalid Token")

    req.user = user
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token")
  }
})

export { verifyJWT }