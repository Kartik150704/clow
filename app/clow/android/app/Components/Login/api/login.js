import axios from "axios"

const authServicePort = `https://backend-ride-service.easecruit.com`

export const GenerateOtp = async (email) => {
  try {
    const response = await fetch(`${authServicePort}/otp/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate OTP');
    }

    return data;
  } catch (error) {
    console.error("Error generating OTP:", error);
    throw error;
  }
};

export const Login = async (email) => {

  let response = await axios.post(`${authServicePort}/rider/login`, { email });
  return response.data;
}