import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- AUTH ----------
export const signup = (data) => api.post("/auth/signup", data);
export const login = (data) => api.post("/auth/login", data);
export const logout = () => api.post("/auth/logout");
export const fetchUser = () => api.get("/auth/onBoarding");

// ---------- TESTS ----------
export const createTest = (data) => api.post("/tests", data);
export const getAllTests = () => api.get("/tests");
export const getTest = (id) => api.get(`/tests/${id}`);
export const updateTest = (id, data) => api.put(`/tests/${id}`, data);
export const deleteTest = (id) => api.delete(`/tests/${id}`);

// fetch only logged-in user's tests
export const getMyTests = () => api.get("/tests/my");

// ---------- SUBMISSIONS ----------
export const submitSolution = (testId, payload) =>
  api.post(`/tests/${testId}/submit`, payload);

// get all submissions of a test (if you later implement)
export const getTestSubmissions = (testId) =>
  api.get(`/tests/${testId}/submissions`);

// get a user's submissions for this test
export const getMySubmissions = (testId) =>
  api.get(`/tests/${testId}/submissions/me`);

export default api;
