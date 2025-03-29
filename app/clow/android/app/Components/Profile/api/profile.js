import axios from "axios"

const authServicePort = `https://backend-ride-service.easecruit.com`

export const FetchProfile = async (id) => {
    try {
        let response = await axios.get(`${authServicePort}/rider/profile/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw error;
    }
}

export const UpdateProfile = async (id, formData) => {
    try {
        // Map the frontend photo field names to the backend field names
        const mappedData = {
            name: formData.name,
            email: formData.email,
            phone_number: formData.phone_number,
            driving_license_number: formData.driving_license_number,
            driving_license_photo: formData.license_photo_url,
            college_id_photo: formData.college_id_photo_url,
            person_photo: formData.selfie_photo_url,
            status: 'unverified' // Always set to unverified when updating
        };
        
        let response = await axios.put(`${authServicePort}/rider/profile/${id}`, mappedData);
        return response.data;
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
}