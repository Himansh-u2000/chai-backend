import jwt from "jsonwebtoken";
import { REFRESH_TOKEN_SECRET } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";


// const genrateAccessAndRefreshToken = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     const accessToken = user.genrateAccessToken();
//     const refreshToken = user.genrateRefreshToken();

//     user.refreshToken = refreshToken;
//     await user.save({ validateBeforeSave: false })

//     return {
//       accessToken,
//       refreshToken
//     }
//   } catch (error) {
//     throw new ApiError(500, "Unable to genrate access token or refresh token")
//   }

// } 

const genrateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.genrateAccessToken()
    const refreshToken = user.genrateRefreshToken()

    user.refreshToken = refreshToken
    user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "unable to genrate refresh token or access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {

  const { email, fullName, username, password } = req.body;

  if (
    [email, fullName, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, message = "All Fields are required");
  } else if (!email.includes("@")) {
    throw new ApiError(400, "Email field is empty or no email found");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }]
  })


  if (existingUser) {
    throw new ApiError(409, "User Already Exists");
  }

  const avatarLocalePath = req.files?.avatar[0]?.path;
  // const coverImageLocalePath = req.files?.coverImage[0]?.path;
  let coverImageLocalePath;

  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) coverImageLocalePath = req.files.coverImage[0].path


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
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
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


// const loginUser = asyncHandler(async (req, res) => {
//   // data validation
//   // find the user
//   // check if password is correct
//   // send access and refresh token
//   // send cookies

//   const { username, email, password } = req.body;
//   if (!username || !email) {
//     throw new ApiError(400, "Username or email is required");
//   }

//   const user = await User.findOne({
//     $or: [{ username }, { email }]
//   })

//   if (!user) throw new ApiError(404, "User does not exists");

//   const isPasswordValid = await user.isPasswordCorrect(password)

//   if (isPasswordValid) throw new ApiError(401, "Password is incorrect")

//   const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(user._id);

//   const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

//   const options = {
//     httpOnly: true,
//     secure: true
//   }

//   return res
//     .status(200)
//     .cookie("accessToken", accessToken, options)
//     .cookie("refreshToken", refreshToken, options)
//     .json(
//       new ApiResponse(
//         200,
//         {
//           accessToken: accessToken,
//           refreshToken: refreshToken
//         },
//         "User successfully logged in"
//       ))
// })


const loginUser = asyncHandler(async (req, res) => {
  // get password from req
  // sanitize input fields
  // find user from email or username
  // verify password 
  // genrate accesstoken and refresh token
  // save refresh token in db
  // send response of 200 and refresh token to client


  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required")
  }

  if (!password) {
    throw new ApiError(400, "password is empty")
  }

  const user = await User.findOne({
    $or: [{ email }]
  })

  if (!user) throw new ApiError(404, "user not found")

  const isPasswordCorrect = user.isPasswordCorrect(password)

  if (!isPasswordCorrect) throw new ApiError(401, "password is incorrect")


  const { accessToken, refreshToken } = await genrateAccessAndRefreshToken(user._id)

  const options = {
    httpOnly: true,
    secure: false,
  }

  const loggedInUser = await User.findById(user._id).select("-password")

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken,
      },
      "user successfully logged in"
    ))

})

// const logoutUser = asyncHandler(async (req, res) => {
//   await User.findByIdAndUpdate(
//     req.user._id,
//     {
//       $set: {
//         refreshToken: undefined
//       },
//     },
//     {
//       new: true
//     }
//   )


//   const options = {
//     httpOnly: true,
//     secure: true
//   }

//   return res
//     .status(200)
//     .clearCookie("accessToken", options)
//     .clearCookie("refreshToken", options)
// })

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    // { $set: { refreshToken: undefined } },
    { $unset: { refreshToken: "" } },
    { new: true }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged Out"));
})


const refreshToken = asyncHandler(async (req, res, next) => {
  // const user = User.findById(req.user._id);
  // if (!user) throw new ApiError(401, "user not valid")
  // const options = {
  //   httpOnly: true,
  //   secure: true
  // }

  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
  if (!incomingRefreshToken) throw new ApiError(401, "unauthorised request")


  try {
    const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) throw new ApiError(401, "invalid refresh token")

    if (incomingRefreshToken !== user?.refreshToken) {

      throw new ApiError(401, "unauthorised refresh token")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const { newRefreshToken, accessToken } = await genrateAccessAndRefreshToken(user._id)

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(new
        ApiResponse(
          200,
          {
            accessToken, refreshToken: newRefreshToken
          },
          "Access Token Refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(500, "unable to refresh token: " + error?.message)
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "password does not match")
  }

  const user = await User.findById(req.user._id)

  if (!user) {
    throw new ApiError(400, "user does not exist")
  }

  if (!(user.isPasswordCorrect(oldPassword))) {
    throw new ApiError(401, "old password does not match")
  }

  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password changed successfully"
      )
    )

})


const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      req.user,
      "user successfully fetched"
    ))
})

const updateAcccountDetails = asyncHandler(async (req, res) => {
  const { username, fullName, email } = req.body

  if ([username, fullName, email].some((field) => field?.trim() === "")) {
    throw new ApiResponse(400, "All fields are required")
  }

  try {
    const user = await User.findByIdAndUpdate(req.user?._id,
      {
        $set: {
          username,
          email,
          fullName
        }
      },
      {
        new: true
      }
    ).select("-password")

    if (!user) {
      throw new ApiError(400, "unable to update user")
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        user,
        "details updated successfully"
      ))
  } catch (error) {
    throw new ApiError(500, "unable to find update details: ", error.message)
  }
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localeAvatar = req.files?.avatar[0]?.path;

  console.log(localeAvatar)

  if (!localeAvatar) {
    throw new ApiError(500, "file not available in local storage")
  }

  const avatar = await uploadFileOnCloudinary(localeAvatar)

  if (!avatar) {
    throw new ApiError(200, "unable to upload file")
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar?.url || ""
        }
      },
      {
        new: true
      }
    ).select("-password")

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        user,
        "image uploaded successfully"
      ))
  } catch (error) {
    throw new ApiError(500, "unable to update file")
  }
})

export {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  updateAcccountDetails,
  updateUserAvatar
};
