import { emitter } from "./mitt";

export const u = (path) =>
  // eslint-disable-next-line no-undef
  process.env.NODE_ENV === "development"
    ? `http://localhost:3030${path}`
    : path;

export const authFetch = async (url, options = {}, retries = 3) => {
  const token = localStorage.getItem("token");
  const endpoint = u(url);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        ...options,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      return res;
    } catch (err) {
      console.warn(`[authFetch] attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
};



export const authFetchWithoutContentType = async (url, options) => {
  const token = localStorage.getItem("token");
  const res = await fetch(u(url), {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.logout && window.logout();
    emitter.emit("logout");
  }
  return res;
};
