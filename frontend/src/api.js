import { API_BASE } from "./config";

const parseJsonSafe = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const buildHeaders = (token) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.token = token;
  }
  return headers;
};

const fetchJSON = async (url, options = {}) => {
  const response = await fetch(url, options);
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    const message =
      body?.error?.message || body?.message || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
};

export const login = async (id, password) => {
  return await fetchJSON(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ id, password }),
  });
};

export const getDashboardSummary = async (token) => {
  return await fetchJSON(`${API_BASE}/graduation/summary`, {
    method: "POST",
    headers: buildHeaders(token),
  });
};

export const getCategoryData = async (token, categoryId) => {
  return await fetchJSON(`${API_BASE}/graduation/categories/${categoryId}`, {
    method: "GET",
    headers: buildHeaders(token),
  });
};
