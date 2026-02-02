export const fetchAttribute = async (id, token) => {
    const url = `https://ask.slu.edu/SBTDWebApi/api/attributes/${id}/choices`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch attributes: ${response.status} - ${errorText}`);
            throw new Error(`Failed to fetch attributes: ${response.status} - ${errorText}`);
        }
        const attribute = await response.json();
        return attribute;
    } catch (error) {
        console.error('Error fetching attributes:', error);
        throw error;
    }
}