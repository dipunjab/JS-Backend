import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controllers.js";

const router = Router()
router.use(verifyJWT);

router.route("/channelstats").get(getChannelStats)
router.route("/channelvideos").get(getChannelVideos)


export default router