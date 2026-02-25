import React, { useState } from 'react';
import { Input, Button } from 'tabler-react-2';
import { authFetch } from "#url";
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

export const useTDXTickets = () => {
    const {shopId} = useParams();
    const [auth, setAuth] = useState({ token: sessionStorage.getItem('bearer_token') });
    const [ticketId, setTicketId] = useState('');
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentDate = new Date();
    const nextWeekDate = new Date(currentDate);

    const handleLogin = (shopId) => {
        setLoading(true);

        const relayUrl = `http://localhost:3030/api/tdx-auth?shopId=${shopId}`; // update later
        const loginWindow = window.open(relayUrl, "OktaLogin", "width=500,height=600");

        const timer = setInterval(() => {
        try {
            if (loginWindow.location.href.includes(window.location.hostname)) {
            const urlParams = new URLSearchParams(loginWindow.location.search);
            const token = urlParams.get('token');

            if (token) {
                sessionStorage.setItem('bearer_token', token);
                setAuth({ token: token });
                
                loginWindow.close(); // This will work now because domains match!
                clearInterval(timer);
                setLoading(false);
                toast.success("TDX Authenticated");
            }
            }
        } catch (e) {
            toast.error(e);
            setError(e);
        }
        }, 1000);
    };

    const fetchTicket = async (id) => {
        var ticket;

        if (!id) {
            toast.error("Please enter a Ticket ID");
            return null;
        }

        setLoading(true);
        setError(null);
        toast.loading("Fetching ticket from TDX...");
        
        try {
            // Pointing to your proxy endpoint
            try {
                const r = await authFetch(`/api/tdx-ticket?ticketId=${id}&token=${auth.token}`);
                ticket = await r.json();
                setTicket(ticket);
            } catch (error) {
                setError(error);
                toast.error(`Ticket fetch failed: ${error}`);
            }

            // Extract values from TDX Attributes
            // const costAttr = ticket?.Attributes.find(item => item.ID === 2312)?.Value || 0.00;
            const descriptionAttr = `${ticket?.Attributes.find(item => item.ID === 2328)?.Value}; ${ticket?.Attributes.find(item => item.ID === 2311)?.Value}`;
            
            // Map the TDX response to the specific order _createJob expects
            return {
                title: ticket?.Title ? `TDX: ${ticket?.Title}` : "No Title Available",
                description: descriptionAttr,
                dueDate: nextWeekDate.setDate(currentDate.getDate() + 7), // Defaulting to week from current day
                onBehalfOf: true,
                onBehalfOfUserId: ticket?.RequestorUID || '',
                onBehalfOfUserEmail: ticket?.RequestorEmail || '',
                onBehalfOfUserFirstName: ticket?.RequestorFullName?.split(" ")[0] || "Unknown",
                onBehalfOfUserLastName: ticket?.RequestorFullName?.split(" ")[1] || "Unknown",
                onBehalfOfBillingGroup: false, // Defaulting as per your previous state
                onBehalfOfBillingGroupId: null
            };
        } catch (error) {
            setError(error.message);
            toast.error(error.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const TDXTicketIdInput = ({ onSubmit }) => {
        if (!auth.token) {
            return (
                <div>
                    <div>
                        <Button
                            loading={loading}
                            onClick={async () => {
                                handleLogin(shopId);
                            }}
                        >
                            Log Into TDNext
                        </Button>
                    </div>
                </div>
            )
        }
        return (
            <div>
                <div className="d-flex align-items-end gap-2 border-b-5 border-b-black">
                    <Input
                        value={ticketId}
                        onChange={(val) => setTicketId(val)}
                        label="TDNext Ticket ID"
                        placeholder="Ticket ID"
                        className="mt-0"
                    />
                    <Button 
                        loading={loading}
                        onClick={async () => {
                            const data = await fetchTicket(ticketId);
                            if (data && onSubmit) {
                                // Call onSubmit with positional arguments to match _createJob
                                onSubmit(
                                    data.title,
                                    data.description,
                                    data.dueDate,
                                    data.onBehalfOf,
                                    data.onBehalfOfUserId,
                                    data.onBehalfOfUserEmail,
                                    data.onBehalfOfUserFirstName,
                                    data.onBehalfOfUserLastName,
                                    data.onBehalfOfBillingGroup,
                                    data.onBehalfOfBillingGroupId
                                );
                            }
                        }}
                    >
                        Import Ticket
                    </Button>
                </div>
            </div>
        );
    };

    return {
        ticket,
        ticketId,
        setTicketId,
        fetchTicket,
        TDXTicketIdInput,
        error
    };
};