import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controllers.js";

const router = Router()
router.use(verifyJWT);

router.route("/createplaylist").post(createPlaylist)
router.route("/addvideo/:playlistId/:videoId").patch(addVideoToPlaylist)             
router.route("/userplaylist/:userId").get(getUserPlaylists)
router.route("/playlistbyid/:playlistId").get(getPlaylistById)
router.route("/removeVideoFromPlaylist/:playlistId/:videoId").get(removeVideoFromPlaylist)
router.route("/:playlistId")
            .delete(deletePlaylist)
            .patch(updatePlaylist)

export default router