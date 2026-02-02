import { authenticate } from "./api/routes/auth/auth.jsx";
import { fetchTickets } from "./api/routes/tickets/tickets.jsx";
import dotenv from "dotenv";
dotenv.config();

const getTdxToken = await authenticate(process.env.TDX_USERNAME, process.env.TDX_PASSWORD);

const tickets = await fetchTickets(238856, getTdxToken);
console.log(tickets);