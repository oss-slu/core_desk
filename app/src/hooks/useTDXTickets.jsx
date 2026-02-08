import React, { useState } from 'react';

export const useTDXTickets = () => {
    const [auth, setAuth] = useState({ username: '', password: '', token: null });
    const [ticketId, setTicketId] = useState('');
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTicket = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/add-ons/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({id: ticketId, token: auth.token })
            });
            const data = await res.json();
            setTicket(data);
        } catch (err) {
            alert("Ticket search failed");
        } finally {
            setLoading(false);
        }
    };
}