import React, { useState } from 'react';
import { Input, Util } from 'tabler-react-2';
import { Button } from "#button";

export const useTDXTickets = () => {
    const [ticketId] = useState('');
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTicket = async (token) => {
        setLoading(true);
        try {
            const res = await fetch('/api/add-ons/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id: ticketId, token: token })
            });
            const data = await res.json();
            setTicket(data);
        } catch (err) {
            alert(`Ticket search failed: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const TDXTicketIdInput = () => {
        return (
            <Util.Row justify="between" align="center">
                <Input // will add functionality to fill in values with ticket info
                    value={ticketId}
                    // onChange={(e) => setTicketId(e.target.value)}
                    label="TDNext Ticket ID"
                    placeholder="Ticket ID"
                />
                <Button 
                    loading={loading}
                    onClick={() => {
                        setLoading(true);
                        fetchTicket();
                    }}
                >Import Ticket</Button>
            </Util.Row>
        );
    }

    return {
        ticketId,
        ticket,
        fetchTicket,
        TDXTicketIdInput
    }
}