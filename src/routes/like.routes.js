import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from '../controllers/like.controllers.js';

const router = Router()
router.use(verifyJWT);

router.route("/toggleVideoLike/:videoId").patch(toggleVideoLike)
router.route("/toggleCommentLike/:commentId").patch(toggleCommentLike)
router.route("/toggleTweetLike/:tweetId").patch(toggleTweetLike)
router.route("/getLikedVideos").get(getLikedVideos)

export default router