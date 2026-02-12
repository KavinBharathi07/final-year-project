import axios from "axios";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
export const api = axios.create({ baseURL: apiBase });

/** Base URL for uploads (server root), e.g. http://localhost:4000 */
export const uploadsBase = apiBase.replace(/\/api\/?$/, "");

