import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // console.log("Channel ID:", channelId);
    // console.log("User ID:", req.user?._id);
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) throw new ApiError(404, "Invalid Channel id")
    if (!req.user?._id) throw new ApiError(404, "unauthorized User id")

    const isSubscriber = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })

    let status;

    if (!isSubscriber) {
        await Subscription.create({
            channel: channelId,
            subscriber: req.user._id
        })
        status = { isSubscriber: true }
    }
    else {
        await Subscription.findByIdAndDelete(
            isSubscriber._id
        )
        status = { isSubscriber: false }
    }

    const allSubscriptions = await Subscription.find({ channel: channelId });
    console.log("Current Subscriptions:", allSubscriptions);

    return res.json(new ApiResponse(200, status, "subscription toggeld successfully"))
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!isValidObjectId(channelId)) throw new ApiError(404, "Invalid Channel ID");


    const channel = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $unwind: "$subscriber", // Flatten the array
        },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscriber._id",
                fullname: "$subscriber.fullname",
                username: "$subscriber.username",
                avatar: "$subscriber.avatar",
                subscribedAt: "$createdAt",
            },
        },
    ])
    console.log("Fetched Subscribers:", channel)
    return res.json(new ApiResponse(200, channel, "USer channel subscriber fetched successfully"))
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(404,"Invalid subscriber id")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo"
            }
        },
        {
            $unwind: "$subscribedTo"
        },
        {
            $project:{
                fullname: "$subscribedTo.fullname",
                avatar: "$subscribedTo.avatar",
                username: "$subscribedTo.username"
            }
        }
    ])
    
    if (!subscriber || subscriber.length === 0) {
        throw new ApiError(404, "No subscribed channels found for the given subscriber id");
    }

    return res.json(new ApiResponse(200,subscriber,"channel list fetched successfully"))
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}