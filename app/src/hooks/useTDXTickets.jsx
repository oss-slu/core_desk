import React, { useState, useCallback } from 'react';
import { Input, Button } from 'tabler-react-2';
import { authFetch } from "#url";
import toast from 'react-hot-toast';

export const useTDXTickets = () => {
    const [ticketData, setTicketData] = useState(null);
    const [ticketId, setTicketId] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(null);

    const currentDate = new Date();
    const nextWeekDate = new Date(currentDate);

    const fetchTicket = useCallback(async (id) => {
        if (!id) {
            toast.error("Please enter a Ticket ID");
            return null;
        }

        setIsFetching(true);
        setError(null);
        toast.loading("Fetching ticket from TDX...");
        
        try {
            // Pointing to your proxy endpoint
            try {
                const r = await authFetch(`/api/tdx-ticket?ticketId=${id}`);
            } catch (error) {
                setError(error);
                toast.error(`Ticket fetch failed: ${error}`);
            }

            const ticket = await r.json();
            setTicketData(ticket);

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
            setIsFetching(false);
        }
    }, []);

    const TDXTicketIdInput = ({ onSubmit }) => {
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
                        loading={isFetching}
                        onClick={async () => {
                            const data = await fetchTicket(ticketId);
                            if (data && onSubmit) {
                                // Call onSubmit with positional arguments to match _createJob
                                onSubmit(data);
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
        ticketData,
        ticketId,
        setTicketId,
        fetchTicket,
        TDXTicketIdInput,
        error
    };
};