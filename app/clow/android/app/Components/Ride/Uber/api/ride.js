import axios from "axios"

const authServicePort = `http://10.0.2.2:5001`



export const CreateRide = async (customerId, placeTo) => {

    let response = await axios.post(`${authServicePort}/ride/`, { customerId, placeTo });
    return response.data;
}

export const FetchIncompleteRides = async (customerId) => {
    let response = await axios.get(`${authServicePort}/ride/customer/${customerId}`);
    return response.data;
}