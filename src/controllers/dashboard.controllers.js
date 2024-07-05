import mongoose from "mongoose"
import { Video } from "../models/video.models.js"
import { Subscription } from "../models/subscription.models.js"
import { Like } from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    if (!req.user?._id) throw new ApiError(404, "Unauthorized request");

    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $lookup: {
                from: "tweets",
                localField: "owner",
                foreignField: "owner",
                as: "tweets",
            },
        },
        {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likedVideos",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "video",
              as: "videoComments",
            },
          },
        {
            $group: {
              _id: null,
              totalVideos: { $sum: 1 },
              totalViews: { $sum: "$views" },
              subscribers: { $first: "$subscribers" },
              subscribedTo: { $first: "$subscribedTo" },
              totalLikes: { $sum: { $size: "$likedVideos" } },
              totalComments: { $sum: { $size: "$videoComments" } },
              totalTweets: { $first: { $size: "$tweets" } },
            },
          },
        {
            $project: {
                subscribers: { $size: "$subscribers" },
                subscribedTo: { $size: "$subscribedTo" },
                totalTweets: 1,
                totalComments:1,
                totalLikes:1,
                totalViews:1,
                totalVideos:1
            }
        }
    ])


    return res.json(new ApiResponse(200, channelStats, "Channel Stats fetched successfully"))
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    if (!req.user?._id) throw new ApiError(404, "Unauthorized request");

    const video = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user.id)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "videoFile",
                foreignField: "_id",
                as: "videos"
            }
        },
        
        {
            $project:{
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description:1
            }
        }
    ])

    return res.json(new ApiResponse(200,video,"Videos fetcehd successfully"))
});

export {
    getChannelStats,
    getChannelVideos
}