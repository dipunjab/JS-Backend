import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controllers.js";

const router = Router()
router.use(verifyJWT);

router.route("/:channelId")
            .patch(toggleSubscription)  
            .get(getUserChannelSubscribers)
            
router.route("/userChannel/:subscriberId").get(getSubscribedChannels)

export default router