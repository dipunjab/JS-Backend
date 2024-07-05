import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js"

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $project: {
                video: 1,
                owner: 1,
                content: 1,
                createdAt:1
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ]).limit(limit).skip((page - 1) * limit)

    if (!comments) {
        throw new ApiError(404, "Could not find comments")
    }
    if (comments == "") {
        throw new ApiError(404, "no comments")
    }
    return res.json(new ApiResponse(200, comments, "comments of video fetched successfully"))
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id")

    const { content } = req.body;
    if (content?.trim() === "") throw new ApiError(404, "content is required")

    const addComment = await Comment.create({
        video: videoId,
        content,
        owner: req.user._id
    })
    if (!addComment) throw new ApiError(500, "Something went wrong while adding comment")

    return res.json(new ApiResponse(201, addComment, "Comment Added Successfully"))
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment Id")

    const { content } = req.body;
    if (content?.trim() === "") throw new ApiError(404, "content is required")

    const comment = await Comment.findById(commentId)

    if (comment.owner.toString() !== req.user.id) {
        throw new ApiError(403, "You can only update your comment");
    }

    const updateComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    return res.json(new ApiResponse(201, updateComment, "Comment Updated Successfully"))
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment Id")

    const comment = await Comment.findById(commentId)

    if (comment.owner.toString() !== req.user.id) {
        throw new ApiError(403, "You can only update your comment");
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId)

    return res.json(new ApiResponse(201, deleteComment, "Comment Deleted Successfully"))
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}