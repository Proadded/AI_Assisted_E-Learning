import { create } from "zustand";
import axiosInstance from "../lib/axios";

const useChatStore = create((set, get) => ({
    isOpen: false,
    history: [],
    isLoading: false,
    error: null,

    openChat: () => set({ isOpen: true }),

    closeChat: () => set({ isOpen: false, history: [], error: null }),

    sendMessage: async (message, courseId) => {
        const userMsg = { role: "user", content: message };
        set((state) => ({
            history: [...state.history, userMsg],
            isLoading: true,
            error: null,
        }));

        try {
            const res = await axiosInstance.post("/chat/message", {
                message,
                courseId,
                history: get().history,
            });
            set((state) => {
                const updated = [...state.history, { role: "assistant", content: res.data.reply }];
                return { history: updated.slice(-20), isLoading: false };
            });
        } catch (err) {
            console.log("Error in sendMessage:", err);
            set({ error: "Failed to get a response. Try again.", isLoading: false });
        }
    },

    clearHistory: () => set({ history: [], error: null }),
}));

export default useChatStore;
