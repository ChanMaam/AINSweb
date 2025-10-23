import axios from "axios";

// One place for all requests.
// In dev with MSW, keep baseURL as "/" (relative) so MSW can intercept.
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "/",
  timeout: 15000,
});

// Optional interceptors: normalize errors for nicer messages
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);
