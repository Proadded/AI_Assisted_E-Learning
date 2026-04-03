import { create } from "zustand";
import axiosInstance from "../lib/axios.js";
import toast from "react-hot-toast";

const useTestStore = create((set, get) => ({
    test: null,
    result: null,
    isLoading: false,
    isSubmitting: false,
    isPolling: false,
    error: null,

    fetchTest: async (videoId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axiosInstance.get(`/tests/video/${videoId}`);
            set({ test: res.data.test });
        } catch (error) {
            set({ error: "Failed to load test" });
            toast.error("Failed to load test");
            console.error("fetchTest error:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    submitAnswers: async (testId, answers) => {
        set({ isSubmitting: true, error: null });
        try {
            const res = await axiosInstance.post(`/tests/${testId}/submit`, { answers });
            set({ result: res.data });
            return res.data;
        } catch (error) {
            set({ error: "Failed to submit answers" });
            toast.error("Failed to submit answers");
            console.error("submitAnswers error:", error);
        } finally {
            set({ isSubmitting: false });
        }
    },

    pollResult: async (resultId) => {
        set({ isPolling: true, error: null });
        try {
            const res = await axiosInstance.get(`/tests/result/${resultId}`);
            set({ result: res.data.result });
            return res.data.result;
        } catch (error) {
            set({ error: "Failed to poll result" });
            toast.error("Failed to poll result");
            console.error("pollResult error:", error);
        } finally {
            set({ isPolling: false });
        }
    },

    clearTest: () => set({
        test: null,
        result: null,
        error: null
    })
}));

export default useTestStore;
