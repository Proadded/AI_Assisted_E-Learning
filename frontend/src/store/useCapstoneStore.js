import { create } from "zustand";
import axiosInstance from "../lib/axios.js";
import toast from "react-hot-toast";

const useCapstoneStore = create((set, get) => ({
    status: null,
    session: null,
    answers: {},
    result: null,
    isLoading: false,
    error: null,

    fetchStatus: async (courseId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axiosInstance.get(`/capstone/status/${courseId}`);
            set({ status: res.data });
        } catch (error) {
            set({ error: "Failed to fetch capstone status" });
            toast.error("Failed to fetch capstone status");
            console.error("fetchStatus error:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    generateSession: async (courseId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axiosInstance.post(`/capstone/generate/${courseId}`);
            set({ session: res.data, answers: {} });
        } catch (error) {
            set({ error: "Failed to generate capstone session" });
            toast.error("Failed to generate capstone session");
            console.error("generateSession error:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    setAnswer: (questionIndex, selectedIndex) => {
        set((state) => ({
            answers: {
                ...state.answers,
                [questionIndex]: selectedIndex
            }
        }));
    },

    submitCapstone: async (sessionId) => {
        set({ isLoading: true, error: null });
        try {
            const answersObj = get().answers;
            const answersArray = Object.entries(answersObj).map(([qi, si]) => ({
                questionIndex: Number(qi),
                selectedIndex: si
            }));

            const res = await axiosInstance.post(`/capstone/submit/${sessionId}`, { answers: answersArray });
            set({ result: res.data });
            return res.data;
        } catch (error) {
            set({ error: "Failed to submit capstone" });
            toast.error("Failed to submit capstone");
            console.error("submitCapstone error:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    fetchResult: async (sessionId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axiosInstance.get(`/capstone/result/${sessionId}`);
            set({ result: res.data });
        } catch (error) {
            set({ error: "Failed to fetch capstone result" });
            toast.error("Failed to fetch capstone result");
            console.error("fetchResult error:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    clearSession: () => set({
        session: null,
        answers: {},
        result: null
    })
}));

export default useCapstoneStore;
