import mongoose,{isValidObjectId} from "mongoose";
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadonCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js";
import { refreshAccessToken } from "./user.controllers.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId, videoFile} = req.query
    //TODO: get all videos based on query, sort, pagination
    let videofilter = {};
    if (videoFile) {
        videofilter = { videoFile: videoFile };
    }

    const videos = await 
                  Video.find(videofilter)
                  .populate("owner", "fullname")
                  .limit(limit)
                  .skip((page -1)*limit)

         return res.json(new ApiResponse(200, {videos}, "yeah"))
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (!(description||title)) {
        throw new ApiError(400, `All fields are compulsory`)
    }

    const videoPath = req.files?.video[0]?.path
    if (!videoPath) {
        throw new ApiError(400, "video is required 1")
    };

    const thumbnailPath = req.files?.thumbnail[0]?.path
    if (!thumbnailPath) {
        throw new ApiError(400, "thumbnail is required 1")
    };
    
    const videoUpload = await uploadonCloudinary(videoPath)
    if (!videoUpload) {
        throw new ApiError(400, "video is required")
    };
    const thumbnaiUpload = await uploadonCloudinary(thumbnailPath)
    if (!thumbnaiUpload) {
        throw new ApiError(400, "thumbnail is required")
    };
    
    
    console.log(videoUpload.url, "Video uploaded");
    console.log(thumbnaiUpload.url, "thumbnail uploaded");
    

    const video = await Video.create({
        title,
        videoFile: videoUpload.url,
        description,
        duration: videoUpload.duration,
        thumbnail: thumbnaiUpload.url,
        owner: req.user._id,
        isPublished: true
    })

    return res.json(
        new ApiResponse(200, video, "Video And Thumnail uploaded successfully")
    )
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Id of video is missing")
    }

    const video = await Video.findById(videoId)

    return res.json(new ApiResponse(200,video, "fetched"))
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Id of video is missing")
    }
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body
    const thumbanillocalpath = req.file?.path

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Id of video is missing")
    }
    if (!(title || description)) {
        throw new ApiError(400,"All fields are required")
    }

    const video = await Video.findById(videoId)
    
    if (video.owner.toString() !== req.user.id) {
        throw new ApiError(403, "You can only update your videos");
    }

    const newthumbnail = await uploadonCloudinary(thumbanillocalpath)
    if (!newthumbnail) {
        throw new ApiError(400,"newthumbnail not found")
    }

    const updateInfo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: newthumbnail?.url
            }
        },
            {new: true}
    )



    return res.json(new ApiResponse(200,updateInfo, "updated successfully"))
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Id of video is missing")
    }
    //TODO: delete video
    const video =await Video.findById(videoId)

    if (video.owner.toString() !== req.user.id) {
        throw new ApiError(400, "You cannot delete this video.")
    }

    const deleteVideo = await Video.deleteOne({_id: videoId})

    return res.json(new ApiResponse(200,deleteVideo,"Video has been Delete frome database"))
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Id of video is missing")
    }
    const video = await Video.findById(videoId, {isPublished: 1, owner: 1})
    
    if (video.owner.toString() !== req.user.id) throw new ApiError(400,"Unathorized request")
     
     const toggleVideo = await Video.findByIdAndUpdate(videoId,{
        $set: {
            isPublished: !video?.isPublished
        }
    },
    {
        new: true
    })   

    return res.json(new ApiResponse(200,toggleVideo,
        toggleVideo?.isPublished ? "Video Published Successfully" : "Video Unpublished Successfully"))    
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}