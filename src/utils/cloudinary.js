import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { ApiError } from './ApiError.js';


    // Configuration
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Upload an image
    const uploadonCloudinary = async (localFilePath)=>{
        try{
            if (!localFilePath) return null
            //upload file on cloudinary
           const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto"
            })
            //file has been succefully uploaded
            // console.log("File is uploaded on cloudinary", response.url)
            fs.unlinkSync(localFilePath)
            return response

        }catch(error){
            fs.unlinkSync(localFilePath);// remove the local save file 
            return null
        }
    };

    //delete an image
    const deleteFromCloudinary = async (url,publicId)=>{
        try {
            if (!(url||publicId))  throw new ApiError(400,"url or id not found while dleting from cloudinary")
            
            const response = await cloudinary.uploader.destroy(publicId,
                {resource_type: `${url.includes("image") ? "image": "video"}`}
            )    
            console.log("Asset deleted from Cloudinary:", response);
        } catch (error) {
            console.error("Error deleting asset from Cloudinary:", error);
            throw new ApiError(500, error?.message || "Server error");
        }
    }


export {uploadonCloudinary, deleteFromCloudinary}