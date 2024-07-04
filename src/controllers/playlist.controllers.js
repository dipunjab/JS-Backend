import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {Video} from "../models/video.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    
    if (!(name||description)) {
        throw new ApiError(404,"All fields are reuired")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist) throw new ApiError(404,"Failed to create playlist")

    return res.json(new ApiResponse(200,playlist,"playlist created Successfully"))
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)) throw new ApiError(400,"Invalid userid")
     
    const userPlaylist = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description:1,
                "user._id": 1,
                "user.username": 1,
                "user.email": 1,
                videos: 1
            }
        }
    ])    

   return res.json(new ApiResponse(200,userPlaylist,"user playlist fetched successfully"))     
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)) throw new ApiError(400,"Pinvalid Playlist id")

    const playlist = await Playlist.findById({_id: playlistId})
    
    if(!playlist) throw new ApiError(404,"Failed to fetched playlist")

    return res.json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404,"Invalid  playlist Id")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404,"Invalid  video Id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(400,"Playlist wa not found")

    const video = await Video.findById(videoId)
    if(!playlist) throw new ApiError(400,"Playlist wa not found") 
        
    const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId,{
        $addToSet:{
            videos: videoId
        }
    },{new: true})    

   return res.json(new ApiResponse(200, updatePlaylist,"Video added to playlist successfully"))
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)|| !isValidObjectId(videoId)) throw new ApiError(404,"Invalid id")

    const findVideo = await Playlist.findOne({
        _id: playlistId,
        videos: videoId
    });
    if (!findVideo) {
        throw new ApiError(404,"Video not found")
    }
    
    const removeVideo = await Playlist.findByIdAndUpdate(playlistId,{
        $pull:{
            videos: videoId
        }
    },{new: true})

    return res.json(new ApiResponse(200,removeVideo,"Video removed from playlist"))
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)) throw new ApiError(404,"Invalid id")

    const deletePlaylist= await Playlist.findByIdAndDelete(playlistId)   

    if(!deletePlaylist) throw new ApiError(404,"Playlist not found")

    return res.json(new ApiResponse(200,deletePlaylist,"Playlist deleted successfully"))
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId))  throw new ApiError(404,"Invalid id")

    const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set:{
                name,description
            }
        },
        {new: true}
    )    

    return res.json(new ApiResponse(200,updatePlaylist,"Playlist Updated successfully"))
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}