import { create } from "zustand";
import axiosInstance from "../lib/axios.js";
import toast from "react-hot-toast";

const CAPSTONE_STORAGE_PREFIX = "capstone_session_";
const CAPSTONE_ACTIVE_SESSION_KEY = "capstone_active_session_id";

const readStoredSession = (sessionId) => {
  try {
    const raw = sessionStorage.getItem(`${CAPSTONE_STORAGE_PREFIX}${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const persistSession = (session) => {
  if (!session?._id) return;
  sessionStorage.setItem(`${CAPSTONE_STORAGE_PREFIX}${session._id}`, JSON.stringify(session));
  sessionStorage.setItem(CAPSTONE_ACTIVE_SESSION_KEY, session._id);
};

const clearPersistedSession = (sessionId) => {
  if (sessionId) {
    sessionStorage.removeItem(`${CAPSTONE_STORAGE_PREFIX}${sessionId}`);
  }
  sessionStorage.removeItem(CAPSTONE_ACTIVE_SESSION_KEY);
};

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
      return res.data;
    } catch (error) {
      set({ error: "Failed to load capstone status" });
      toast.error("Failed to load capstone status");
      console.error("fetchStatus error:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  generateExam: async (courseId, sessionIdFromUrl = null) => {
    set({ isLoading: true, error: null });
    try {
      if (sessionIdFromUrl) {
        const storedSession = readStoredSession(sessionIdFromUrl);
        if (storedSession) {
          set({ session: storedSession, answers: {} });
          return storedSession;
        }
      }

      const res = await axiosInstance.post(`/capstone/generate/${courseId}`);
      const createdSession = res.data?.session || null;
      set({ session: createdSession, answers: {}, result: null });
      if (createdSession?._id) {
        persistSession(createdSession);
      }
      return createdSession;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to generate capstone exam";
      set({ error: message });
      toast.error(message);
      console.error("generateExam error:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  setAnswer: (questionIndex, selectedIndex) => {
    const prevAnswers = get().answers || {};
    set({
      answers: {
        ...prevAnswers,
        [questionIndex]: selectedIndex,
      },
    });
  },

  submitExam: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const { answers } = get();
      const payload = {
        answers: Object.entries(answers || {}).map(([qi, si]) => ({
          questionIndex: Number(qi),
          selectedIndex: si,
        })),
      };
      const res = await axiosInstance.post(`/capstone/submit/${sessionId}`, payload);
      set({ result: res.data });
      clearPersistedSession(sessionId);
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to submit capstone exam";
      set({ error: message });
      toast.error(message);
      console.error("submitExam error:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchResult: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axiosInstance.get(`/capstone/result/${sessionId}`);
      set({ result: res.data });
      return res.data;
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to load capstone result";
      set({ error: message });
      toast.error(message);
      console.error("fetchResult error:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  clearCapstone: () => {
    const activeSessionId = get().session?._id || sessionStorage.getItem(CAPSTONE_ACTIVE_SESSION_KEY);
    clearPersistedSession(activeSessionId);
    set({
      status: null,
      session: null,
      answers: {},
      result: null,
      isLoading: false,
      error: null,
    });
  },
}));

export default useCapstoneStore;
