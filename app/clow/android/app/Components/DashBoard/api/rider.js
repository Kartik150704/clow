const authServicePort = `https://backend-ride-service.easecruit.com`

export const CheckProfileValidity = async (id) => {
    let response = await fetch(`${authServicePort}/rider/profile/${id}/isVerified`);
    return response.json();
}