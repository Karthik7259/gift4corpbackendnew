import axios from 'axios';

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Shiprocket API credentials - store in .env file
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;

/** Must match the pickup location *name* in Shiprocket → Settings → Pickup Addresses (e.g. Home-1). */
export const SHIPROCKET_PICKUP_LOCATION =
    process.env.SHIPROCKET_PICKUP_LOCATION || 'Home-1';

let authToken = null;
let tokenExpiry = null;

// Function to get authentication token
export const getShiprocketToken = async () => {
    try {
        // Check if token is still valid
        if (authToken && tokenExpiry && Date.now() < tokenExpiry) {
            return authToken;
        }

        // Login to get new token
        const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
            email: SHIPROCKET_EMAIL,
            password: SHIPROCKET_PASSWORD
        });

        if (response.data.token) {
            authToken = response.data.token;
            // Token typically valid for 10 days, set expiry to 9 days to be safe
            tokenExpiry = Date.now() + (9 * 24 * 60 * 60 * 1000);
            return authToken;
        }

        throw new Error('Failed to get Shiprocket token');
    } catch (error) {
        console.error('Shiprocket authentication error:', error.response?.data || error.message);
        throw error;
    }
};

// Create axios instance with authentication
export const createShiprocketClient = async () => {
    const token = await getShiprocketToken();
    
    return axios.create({
        baseURL: SHIPROCKET_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};

export default {
    getShiprocketToken,
    createShiprocketClient,
    SHIPROCKET_BASE_URL,
    SHIPROCKET_PICKUP_LOCATION
};
