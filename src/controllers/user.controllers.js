import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadonCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from '../utils/ApiResponse.js';


const registerUser = asyncHandler( async (req,res)=>{
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
        [fullname, email, username, password].some((field)=>field?.trim() === "")
    ) {
        throw new ApiError(400, `All fields are compulsory`)
    }   
    
    //check for user if exists
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, `User with email or username already exists.`)
    };


    // check for images check for avatar
        //multer gives assecc to files
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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
    const createdUser =  await User.findById(user._id).select(
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


export { 
    registerUser,
 }