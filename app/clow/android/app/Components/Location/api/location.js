const authServicePort = `https://backend-ride-service.easecruit.com`

export const SendTokenToBackend = async (id, token, deviceType) => {
    try {
        const response = await fetch(`${authServicePort}/notification/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id,token,deviceType })
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching incomplete rides:', error);
        throw error;
    }
}