import postmark from "postmark";

const isTest = process.env.NODE_ENV === "test";

export const client = isTest
  ? { sendEmail: async () => true }
  : new postmark.ServerClient(process.env.POSTMARK_API_KEY);

export default client;