const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

function getUploadFolder() {
    if (process.env.NODE_ENV === 'production') {
        return process.env.CLOUDINARY_FOLDER_PROD || "requests";
    }

    return process.env.CLOUDINARY_FOLDER_DEV || "requests_dev";
}

/**
 * Upload file buffer to Cloudinary
 */
function uploadToCloudinary(fileBuffer) {
    return new Promise((resolve, reject) => {

        const folder = getUploadFolder();

        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
}

module.exports = {
    uploadToCloudinary
};