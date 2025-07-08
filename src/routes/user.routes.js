import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser, logoutUser,
  refreshToken, registerUser,
  updateAcccountDetails,
  updateUserAvatar
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  registerUser
)

router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshToken)
router.route("/change-password").patch(verifyJWT, changeCurrentPassword)
router.route("/get-current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAcccountDetails)
router.route("/update-user-avatar").patch(
  verifyJWT,
  upload.fields([
    { name: "avatar", maxCount: 1 }
  ]),
  updateUserAvatar
)

export default router