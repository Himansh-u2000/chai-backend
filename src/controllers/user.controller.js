import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validate details

  const { email, fullName, username, password } = req.body
  console.log("email: ", email);

  if (
    [email, fullName, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, message = "All Fields are required");
  } else if (!email.includes("@")) {
    throw new ApiError(400, "Email field is empty or no email found");
  }

  const existingUser = User.findOne({
    $or: [{ username }, { email }]
  })

  if (existingUser) {
    throw new ApiError(409, "User Already Exists");
  }

  const avatarLocalePath = req.files?.avatar[0]?.path;
  const coverImageLocalePath = req.files?.coverImage[0]?.path;

  if (!avatarLocalePath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadFileOnCloudinary(avatarLocalePath);
  const coverImage = await uploadFileOnCloudinary(coverImageLocalePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the User");
  }


  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Registered Successfully")
  )

})

export { registerUser }