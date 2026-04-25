import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

const useAuthStore = create((set) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,


    isCheckingAuth: true,

    checkAuth: async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            set({ authUser: null, isCheckingAuth: false });
            return;
        }
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data});
        } catch (err) {
            console.log("Error in checkAuth:", err);
            set({ authUser: null});
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            localStorage.setItem("token", res.data.token);
            set({ authUser: res.data });
            toast.success("Account created successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error signing up");
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post("/auth/login", data);
            localStorage.setItem("token", res.data.token);
            set({ authUser: res.data });
            toast.success("Logged in successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error logging in");
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            localStorage.removeItem("token");
            set({ authUser: null });
            toast.success("Logged out successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error logging out");
        } 
    },
    // setUser: (user) => set({ user }),
    // clearUser: () => set({ user: null }),
}));

export default useAuthStore;