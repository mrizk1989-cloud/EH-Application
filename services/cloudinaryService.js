const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const path = require("path");

function getUploadFolder() {
    if (process.env.NODE_ENV === 'production') {
        return process.env.CLOUDINARY_FOLDER_PROD || "requests";
    }

    return process.env.CLOUDINARY_FOLDER_DEV || "requests_dev";
}

function uploadToCloudinary(fileBuffer, originalName, mimeType) {

    return new Promise((resolve, reject) => {

        const ext = path.extname(originalName).toLowerCase();
        const name = path.parse(originalName).name;

        function getResourceType(mimeType) {
            if (mimeType.startsWith("image/")) return "image";
            if (mimeType === "application/pdf") return "image";
            return "raw";
        };

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: getUploadFolder(),
                resource_type: getResourceType(mimeType),
                public_id: `${Date.now()}_${name}`,
                use_filename: true,
                unique_filename: true,
                // ✅ FORCE EXTENSION PRESERVATION
                format: ext.replace(".", "")
            },
            (error, result) => {
                if (error) return reject(error);

                resolve({
                    url: result.secure_url,
                    public_id: result.public_id,
                    resource_type: result.resource_type,
                    originalName,
                    mimeType
                });
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
}

module.exports = {
    uploadToCloudinary
};