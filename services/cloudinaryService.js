const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {String} folder
 * @returns {Promise<Object>}
 */
function uploadToCloudinary(fileBuffer, folder = "requests") {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto" // supports PDF, images, office files
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