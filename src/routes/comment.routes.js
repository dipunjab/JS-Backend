import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controllers.js";

const router = Router()
router.use(verifyJWT);

router.route("/add/:videoId").post(addComment)
router.route("/update/:commentId").patch(updateComment)
router.route("/:videoId").get(getVideoComments)
router.route("/delete/:commentId").delete(deleteComment)


export default router