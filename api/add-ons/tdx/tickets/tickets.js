import getTDXToken from '../token/token.js';
import dotenv from 'dotenv';
dotenv.config();

function filterById(jsonObject, id) {
    return jsonObject.filter(
        function(jsonObject) {
            return (jsonObject['id'] == id);
        }
    )[0];
}

export const fetchTickets = async (id, token = getTDXToken(process.env.USERNAME, process.env.PASSWORD), appId = 31) => { // sign in with credentials automatically (will update later)
    const url = `${process.env.TDX_URL}/${appId}/tickets/${id}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch tickets: ${response.status} - ${errorText}`);
            throw new Error(`Failed to fetch tickets: ${response.status} - ${errorText}`);
        }
        const ticket = await response.json();

        console.log(ticket);

        const title = ticket?.Title || 'No Title Available';
        const status = ticket?.StatusName || 'No Status Available';
        const requestor = ticket?.RequestorName || 'No Requestor Available';
        const requestorEmail = ticket?.RequestorEmail || 'No Requestor Email Available';
        const department = filterById(ticket?.Attributes, 2329)?.Value || 'No Department Available';
        const paymentMethod = filterById(ticket?.Attributes, 2328)?.Value || 'No Payment Method Available';
        const costBreakdown = filterById(ticket?.Attributes, 2311)?.Value || 'No Cost Breakdown Available';
        const cost = filterById(ticket?.Attributes, 2312)?.Value || 0.00;
        return {
            title,
            status,
            requestor,
            requestorEmail,
            department,
            paymentMethod,
            costBreakdown,
            cost
        };
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }
}