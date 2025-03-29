const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

/**
 * Uploads an image to AWS S3 and returns the URL
 * @param {Buffer} imageBuffer - The image buffer
 * @param {string} originalFilename - Original image file name
 * @param {string} mimeType - Image mime type (e.g., image/jpeg, image/png)
 * @returns {Promise<string>} - The S3 URL of the uploaded image
 */
const uploadImageToS3 = async (imageBuffer, originalFilename, mimeType) => {
    // Get file extension
    const fileExtension = originalFilename.split('.').pop().toLowerCase();

    // Create a unique filename
    const fileName = `${uuidv4()}.${fileExtension}`;

    // Set the appropriate folder in S3
    const fileKey = `images/${fileName}`;

    // Set up S3 upload parameters
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileKey,
        Body: imageBuffer,
        ContentType: mimeType
        // ACL parameter removed to work with buckets that have ACL disabled
    };

    // Upload to S3
    const uploadResult = await s3.upload(params).promise();

    // Return the image URL
    return uploadResult.Location;
};

module.exports = {
    uploadImageToS3
};