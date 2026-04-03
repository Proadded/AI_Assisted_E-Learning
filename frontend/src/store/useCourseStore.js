import { create } from "zustand";
import axiosInstance from "../lib/axios.js";
import toast from "react-hot-toast";

const useCourseStore = create((set, get) => ({
    lessons: [],
    completedVideoIds: new Set(),
    courseMetadata: null,
    activeLessonIndex: 0,
    isLoading: false,
    progressSummary: {
        completedCount: 0,
        totalCount: 0,
        percentComplete: 0
    },

    fetchCourse: async (courseId) => {
        set({ isLoading: true });
        try {
            const [courseRes, videosRes, progressRes] = await Promise.all([
                axiosInstance.get(`/courses/${courseId}`),
                axiosInstance.get(`/videos/course/${courseId}`),
                axiosInstance.get(`/progress/course/${courseId}`)
            ]);
            set({
                courseMetadata: courseRes.data,
                lessons: Array.isArray(videosRes.data) ? videosRes.data : videosRes.data.videos ?? [],
                completedVideoIds: new Set(progressRes.data.completedVideoIds),
                progressSummary: {
                    completedCount: progressRes.data.completedCount,
                    totalCount: progressRes.data.totalCount,
                    percentComplete: progressRes.data.percentComplete
                }
            });
        } catch (error) {
            toast.error("Failed to load course");
            console.error("fetchCourse error:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    setActiveLesson: (index) => set({ activeLessonIndex: index }),

    markLessonComplete: async (videoId) => {
        const { completedVideoIds, progressSummary, lessons } = get();
        if (completedVideoIds.has(videoId)) return;

        const updated = new Set(completedVideoIds);
        updated.add(videoId);
        const completedCount = updated.size;
        const totalCount = lessons.length;
        const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        set({
            completedVideoIds: updated,
            progressSummary: { completedCount, totalCount, percentComplete }
        });

        try {
            await axiosInstance.put(`/videos/${videoId}/watch`);
        } catch (error) {
            const reverted = new Set(get().completedVideoIds);
            reverted.delete(videoId);
            set({
                completedVideoIds: reverted,
                progressSummary
            });
            toast.error("Failed to save progress");
        }
    },

    resetCourse: () => set({
        lessons: [],
        completedVideoIds: new Set(),
        courseMetadata: null,
        activeLessonIndex: 0,
        isLoading: false,
        progressSummary: { completedCount: 0, totalCount: 0, percentComplete: 0 }
    })
}));

export default useCourseStore;