import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content) {
        throw new ApiError(400,"Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    return res.json(new ApiResponse(200, tweet,"Tweet was created successfully"))
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // const { content } = req.query

    // const tweet =await Tweet.find({content: new RegExp(content, 'i'), owner: req.user.id})

    const tweet = await Tweet.aggregate(
        [
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "users",  
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    owner: {
                        $arrayElemAt: ["$owner", 0]  
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    "owner.username": 1,
                    "owner.avatar": 1,
                    "owner.fullname": 1
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]
        
    )

    return res.json(new ApiResponse(200, tweet,"Tweets fetched successfully"))
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if (content.trim()=="") {
        throw new ApiError(404,"Conent is required")
    }

    const tweetid = await Tweet.findById(tweetId)
    
    if (tweetid.owner.toString() !== req.user.id) {
        throw new ApiError(403, "You can only update your tweets");
    }


    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content,
            }
        },
        {new:true}
    )

    return res.json(new ApiResponse(200,tweet,"Tweeet updatedd successfully"))
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    const tweetid = await Tweet.findById(tweetId)
    
    if (tweetid.owner.toString() !== req.user.id) {
        throw new ApiError(403, "You can only delete your tweets");
    }

    const tweet = await Tweet.deleteOne({_id: tweetId})

    return res.json(new ApiResponse(200,tweet,"Tweeet Deleted successfully"))
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}