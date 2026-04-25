import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.VITE_API_URL || "http://localhost:3001/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosInstance;