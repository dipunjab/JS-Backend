import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {Video} from "../models/video.models.js"
import {Tweet} from "../models/tweet.models.js"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid video id")
    }
    if (!req.user?._id) throw new ApiError(404, "unauthorized User id")

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video not found")
    }

    // console.log("Requesting user ID:", req.user?._id);

    const islikeby = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    }) 
    // console.log("Existing like:", islikeby)
    let status;

    if (!islikeby) {
        await Like.create({
            likedBy: req.user._id,
            video: videoId
        })
        status= {islikeby: true}
    }else{
        await Like.findByIdAndDelete(islikeby._id)
        status= {islikeby: false}
    }

    const totalLikes = await Like.countDocuments({ video: videoId });
    status.totalLikes = totalLikes
    return res.json(new ApiResponse(200, status, "like toggeled successfully"))
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400,"Invalid video id")
    }
    if (!req.user?._id) throw new ApiError(404, "unauthorized User id")

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404,"Video not found")
    }

    const isliked = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    }) 

    let status;

    if (!isliked) {
        await Like.create({
            likedBy: req.user._id,
            comment: commentId
        })
        status= {isliked: true}
    }else{
        await Like.findByIdAndDelete(isliked._id)
        status= {isliked: false}
    }

    const totalLikes = await Like.countDocuments({ comment: commentId });
    status.totalLikes = totalLikes
    return res.json(new ApiResponse(200, status, "like toggeled successfully"))
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"Invalid video id")
    }
    if (!req.user?._id) throw new ApiError(404, "unauthorized User id")

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404,"Video not found")
    }

    const isliked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    }) 

    let status;

    if (!isliked) {
        await Like.create({
            likedBy: req.user._id,
            tweet: tweetId,
        })
        status= {isliked: true}
    }else{
        await Like.findByIdAndDelete(isliked._id)
        status= {isliked: false}
    }

    const totalLikes = await Like.countDocuments({ tweet: tweetId });
    status.totalLikes = totalLikes
    return res.json(new ApiResponse(200, status, "like toggeled successfully"))
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedvideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as:"likedVideos"
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $project:{
                videoFile: "$likedVideos._id",
                title: "$likedVideos.title",
                owner: "$likedVideos.owner",
                createdAt: "$likedVideos.createdAt"
            }
        },
        {
            $sort:{
                likeCreatedAt: -1
            }
        }
    ])

   return  res.json(new ApiResponse(200,likedvideos,"Liked videos fetched successfully"))
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}