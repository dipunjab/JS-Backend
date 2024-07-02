import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controllers.js";

const router = Router()
router.use(verifyJWT);

router.route("/").post(createTweet)
                 .get(getUserTweets)
                 
router.route("/:tweetId")
            .patch(updateTweet)  
            .delete(deleteTweet)              

export default router