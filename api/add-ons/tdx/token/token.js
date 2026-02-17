import dotenv from "dotenv";
dotenv.config();

// /api/token/tdx-proxy.js (Server-side)
export default async function getTDXToken(req, res) {
    const { ticketId } = req.query;

    try {
        // 1. Authenticate server-side (Credentials never leave the server)
        const authRes = await fetch(`${process.env.TDX_URL}/auth`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                UserName: process.env.TDX_USERNAME, 
                Password: process.env.TDX_PASSWORD
            }),
        });
        const token = await authRes.text();

        // 2. Fetch the Ticket
        const ticketRes = await fetch(`${process.env.TDX_URL}/31/tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await ticketRes.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch from TDX" });
    }
}