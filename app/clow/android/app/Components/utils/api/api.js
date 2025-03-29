import axios from "axios"

const authServicePort = `https://backend-ride-service.easecruit.com`

export const uploadImage = async (formData) => {

    let response = await axios.post(`${authServicePort}/aws/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}
