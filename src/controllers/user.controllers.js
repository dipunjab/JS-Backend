import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadonCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Somehting went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get User detaile from frontend
    // validation - not empty
    // check if user already exists: usernam,email
    // check for images check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res   

    const { fullname, email, username, password } = req.body
    // console.log("Email: ", email);

    //validation
    //this check for every field if it is empty 
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, `All fields are compulsory`)
    }

    //check for user if exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, `User with email or username already exists.`)
    };

    // console.log(req.files);

    // check for images check for avatar
    //multer gives assecc to files
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatarfile is required")
    };

    // upload them to cloudinary
    const avatar = await uploadonCloudinary(avatarLocalPath)
    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatarfile is required")
    }

    //create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registring the user")
    }

    // return res   
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email 
    // find the user
    // password check
    // access and refresh token    
    // send cookies

    // req body -> data
    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username Or email is required")
    }

    // username or email 
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    // find the user
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUSer = await User.findById(user._id)
        .select("-password -refreshToken")

    // send cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUSer, accessToken, refreshToken,
                },
                "User logged in successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200,
                {},
                "User logged Out successfully"
            )
        )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )


        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", newrefreshToken)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: newrefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(402, error?.message || "Invalid refresh token")
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body
    
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed successfully"))
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
    .json(200,req.user,"Current user fetched successfully")
});

const updateAccountDetail = asyncHandler(async (req, res) => {
    const {fullname, email} = req.body

    if (!fullname || !email) {
        throw new ApiError(400,"All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully."))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"avatar image updated successfully"))

});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"cover image file is missing")
    }

    const coverImage = await uploadonCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Cover image updated successfully"))
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage
}