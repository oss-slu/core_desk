import React, { useState } from 'react';
import { Input, Util } from 'tabler-react-2';
// import toast from 'react-hot-toast';
import { Button } from 'tabler-react-2/dist/button';

const filterById = (attributes, id) => attributes?.find(attr => attr.id === id || attr.AttributeID === id);

const getTDXToken = async () => {
        try {
            const r = await fetch(`${url}/api/auth`, { // url for placeholder
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    UserName: TDX_USERNAME, // placeholder
                    Password: TDX_PASSWORD // placeholder
                }),
            });
            const token = await r.text();
                    
            return token;
        } catch (error) {
            console.error(error);
        }
    }

export const useTDXTickets = () => {
    const [ticketId, setTicketId] = useState('');
    const [ticket, setTicket] = useState(null);
    // const [title, setTitle] = useState('no title');
    const [status, setStatus] = useState('Not Started');
    const [requestor] = useState('');
    const [department] = useState('');
    const [paymentMethod] = useState('');
    const [cost] = useState('');
    // const [description, setDescription] = useState('');
    // const [dueDate] = useState(new Date());
    // const [onBehalfOf, setOnBehalfOf] = useState(false);
    // const [onBehalfOfUserId] = useState('');
    // const [onBehalfOfUserEmail, setOnBehalfOfUserEmail] = useState("");
    // const [onBehalfOfUserFirstName] = useState("");
    // const [onBehalfOfUserLastName] = useState("");
    // const [onBehalfOfBillingGroup] = useState(false);
    // const [onBehalfOfBillingGroupId] = useState(null);
    const [error] = useState(null);

    // var [title, setTitle] = useState('no title');
    // var [description, setDescription] = useState('');
    // var [dueDate] = useState(new Date());
    // var [onBehalfOf, setOnBehalfOf] = useState(false);
    // var [onBehalfOfUserId] = useState('');
    // var [onBehalfOfUserEmail, setOnBehalfOfUserEmail] = useState("");
    // var [onBehalfOfUserFirstName] = useState("");
    // var [onBehalfOfUserLastName] = useState("");
    // var [onBehalfOfBillingGroup] = useState(false);
    // var [onBehalfOfBillingGroupId] = useState(null);

    const fetchTicket = async (id) => { // sign in with credentials automatically (will update later)
        const url = `${url}/api/31/tickets/${id}`; // url for placeholder
    
        try {
            const tdxToken = await getTDXToken();

            const r = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${tdxToken}`,
                    'Content-Type': 'application/json'
                },
            });
            if (!r.ok) {
                const errorText = await r.text();
                console.error(`Failed to fetch tickets: ${r.status} - ${errorText}`);
                throw new Error(`Failed to fetch tickets: ${r.status} - ${errorText}`); // will use toast later
            }

            const ticket = await r.json();
            setTicket(ticket);
    
            const mapTicket = {
                title: ticket?.Title || 'No Title Available',
                description: filterById(ticket?.Attributes, 2311)?.Value || 'No Cost Breakdown Available',
                dueDate: new Date(),
                onBehalfOf: true,
                onBehalfOfUserId: onBehalfOfUserId,
                onBehalfOfUserEmail: ticket?.RequestorEmail || 'No Requestor Email Available',
                onBehalfOfUserFirstName: onBehalfOfUserFirstName,
                onBehalfOfUserLastName: onBehalfOfUserLastName,
                onBehalfOfBillingGroup: onBehalfOfBillingGroup,
                onBehalfOfBillingGroupId: onBehalfOfBillingGroupId
            };
    
            // setTitle(ticket?.Title || 'No Title Available');
            // setStatus(ticket?.StatusName || 'No Status Available');
            // setRequestor(ticket?.RequestorName || 'No Requestor Available');
            // setOnBehalfOf(true);
            // setOnBehalfOfUserEmail(ticket?.RequestorEmail || 'No Requestor Email Available');
            // setDepartment(filterById(ticket?.Attributes, 2329)?.Value || 'No Department Available');
            // setPaymentMethod(filterById(ticket?.Attributes, 2328)?.Value || 'No Payment Method Available');
            // setDescription(filterById(ticket?.Attributes, 2311)?.Value || 'No Cost Breakdown Available');
            // setCost(filterById(ticket?.Attributes, 2312)?.Value || "0.00");

            return mapTicket;
        } catch (error) {
            console.error('Error fetching tickets:', error);
            throw error;
        }
    };

    const TDXTicketIdInput = ({onSubmit}) => {
        return (
            <div>
                <Input
                    value={ticketId}
                    onChange={(e) => setTicketId(e)}
                    label="TDNext Ticket ID"
                    placeholder="Ticket ID"
                />
                <Button 
                    onClick={async () => {
                        const data = await fetchTicket(ticketId);
                        if (data) {
                            const title = data.title;
                            const description = data.description;
                            const dueDate = data.dueDate;
                            const onBehalfOf = data.onBehalfOf;
                            const onBehalfOfUserId = data.onBehalfOfUserId;
                            const onBehalfOfUserEmail = data.onBehalfOfUserEmail;
                            const onBehalfOfUserFirstName = data.onBehalfOfUserFirstName;
                            const onBehalfOfUserLastName = data.onBehalfOfUserLastName;
                            const onBehalfOfBillingGroup = data.onBehalfOfBillingGroup;
                            const onBehalfOfBillingGroupId = data.onBehalfOfBillingGroupId;
                            onSubmit(
                                title,
                                description,
                                dueDate,
                                onBehalfOf,
                                onBehalfOfUserId,
                                onBehalfOfUserEmail,
                                onBehalfOfUserFirstName,
                                onBehalfOfUserLastName,
                                onBehalfOfBillingGroup,
                                onBehalfOfBillingGroupId
                            );
                        }
                    }}>Import Ticket</Button>
            </div>
        );
    }

    return {
        ticketId,
        ticket,
        // title,
        // requestor,
        // status,
        // department,
        // paymentMethod,
        // cost,
        // description,
        // dueDate,
        fetchTicket,
        TDXTicketIdInput,
        error
    }
}