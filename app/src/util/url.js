import { emitter } from "./mitt";

export const u = (path) =>
  process.env.NODE_ENV === "development"
    ? `http://localhost:3000${path}`
    : path;

export const authFetch = async (url, options) => {
  const token = localStorage.getItem("token");
  const res = await fetch(u(url), {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.fetchUser();
    emitter.emit("logout");
  }
  return res;
};
