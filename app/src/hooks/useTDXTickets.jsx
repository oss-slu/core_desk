import React, { useState } from 'react';
import { authFetch } from "#url";
import toast from 'react-hot-toast';

export const useTDXTickets = () => {
    const [auth, setAuth] = useState({ token: localStorage.getItem('tdx_bearer_token') });
    const [ticketId, setTicketId] = useState('');
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentDate = new Date();
    const nextWeekDate = new Date(currentDate);

    const handleLogin = (shopId) => {
        setLoading(true);

        const relayUrl = `${import.meta.env.VITE_API_BASE_URL}/api/tdx-auth?shopId=${shopId}`; // update later
        const loginWindow = window.open(relayUrl, "OktaLogin", "width=500,height=600");

        const timer = setInterval(() => {
            try {
                if (loginWindow.location.href.includes(window.location.hostname)) {
                    const urlParams = new URLSearchParams(loginWindow.location.search);
                    const token = urlParams.get('token');

                    if (token) {
                        localStorage.setItem('tdx_bearer_token', token);
                        setAuth({ token: token });
                        
                        loginWindow.close();
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

    return {
        ticket,
        ticketId,
        setTicketId,
        loading,
        handleLogin,
        fetchTicket,
        error
    };
};