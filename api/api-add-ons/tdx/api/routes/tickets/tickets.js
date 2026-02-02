// const options = {
    // "TicketClassification": {
    //     "Name": "ServiceRequest",
    //     "Value": 46
    // },
    // "TypeID": 15,
    // "TypeName": "End-Point Computing",
    // "TypeCategoryID": 7,
    // "TypeCategoryName": "Printing",
    // "ServiceCategoryID": "53",
    // "ServiceCategoryName": "Poster Printing Request",
//     "ComponentID": 32,
//     "Name": "Student Service Desk tickets",
//     "Page": {
//         "PageSize": 200,
//     }
// };

export const fetchTickets = async (id, token, appId = 31) => {
    const url = `https://ask.slu.edu/SBTDWebApi/api/${appId}/tickets/${id}`;

    try {
        const response = await fetch(url, {
            // method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // body: JSON.stringify(options) // Include searchParams in the request body
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch tickets: ${response.status} - ${errorText}`);
            throw new Error(`Failed to fetch tickets: ${response.status} - ${errorText}`);
        }
        const tickets = await response.json();
        const title = tickets?.Title || 'No Title Available';
        const status = tickets?.StatusName || 'No Status Available';
        const requestor = tickets?.RequestorName || 'No Requestor Available';
        const requestorEmail = tickets?.RequestorEmail || 'No Requestor Email Available';
        const department = tickets?.Attributes[1]?.Value || 'No Department Available';
        const paymentMethod = tickets?.Attributes[2]?.Value || 'No Payment Method Available';
        const costBreakdown = tickets?.Attributes[3]?.Value || 'No Cost Breakdown Available';
        const cost = tickets?.Attributes[4]?.Value || 0.00;
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