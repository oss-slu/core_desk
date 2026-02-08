import { fetchTickets } from './ticket';

export async function POST(request) {
    const { id, token } = await request.json();
    try {
        const data = await fetchTickets(id, token);
        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
}