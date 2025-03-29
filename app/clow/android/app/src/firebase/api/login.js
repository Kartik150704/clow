import axios from "axios"

const authServicePort = `https://backend-ride-service.easecruit.com`

export const Login = async (email) => {

    let response = await axios.post(`${authServicePort}/rider/login`, { email });
    return response.data;
}