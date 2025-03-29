import { uploadImage } from './api/api';

/**
 * Utility function to handle image upload with name
 * @param {string} name - Name for the image
 * @param {File} file - Image file object from file input or drag-and-drop
 * @returns {Promise<Object>} Response containing image URLs
 */
export const handleImageUpload = async (name, file) => {
    try {
        // Validate that the file is an image
        

        // Create FormData object
        const formData = new FormData();
        formData.append('name', name);
        formData.append('image', file);

        // Upload the image using the API function
        const response = await uploadImage(formData);

        return {
            success: true,
            name: response.name,
            imageUrl: response.imageUrl,
            s3Location: response.s3Location
        };
    } catch (error) {
        console.error('Error handling image upload:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload image'
        };
    }
};

/**
 * Utility function to check if file is of valid type and size
 * @param {File} file - File to validate
 * @param {number} maxSizeInMB - Maximum allowed file size in MB
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, maxSizeInMB = 25) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        return {
            valid: false,
            error: 'Only image files are allowed.'
        };
    }

    // Check file size (convert MB to bytes)
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return {
            valid: false,
            error: `Image size should not exceed ${maxSizeInMB}MB.`
        };
    }

    return { valid: true };
};

/**
 * Utility function to create a preview URL for an image file
 * @param {File} file - Image file
 * @returns {string} URL that can be used in img src
 */
export const createImagePreview = (file) => {
    if (!file) return null;
    return URL.createObjectURL(file);
};

/**
 * Utility function to clean up image preview URL when no longer needed
 * @param {string} previewUrl - URL created with createImagePreview
 */
export const revokeImagePreview = (previewUrl) => {
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
};