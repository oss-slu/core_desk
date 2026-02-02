import dotenv from "dotenv";
dotenv.config();

/**
 * Authenticates with the TeamDynamix API.
 * @param {string} username - Your TDX username.
 * @param {string} password - Your TDX password.
 * @returns {Promise<string>} - Returns the Bearer token.
 */
export const authenticate = async (username, password) => {
    const url = 'https://ask.slu.edu/SBTDWebApi/api/auth/login';
    
    // The "loginParams" structure based on typical TeamDynamix API requirements
    const loginParams = {
        UserName: username,
        Password: password
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginParams)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Authentication failed: ${response.status} - ${errorText}`);
            throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
        }

        // The API returns the token directly as a string or within an object
        const token = await response.text();
        
        // Clean the token if it arrives with extra quotes
        return token.replace(/"/g, ''); 
        
    } catch (error) {
        console.error('Error during API authentication:', error);
        throw error;
    }
}