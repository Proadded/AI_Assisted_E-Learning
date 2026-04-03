/**
 * useStudentContextStore.js
 *
 * Zustand store for the Student Context System.
 * Follows the same patterns as useAuthStore and useTestStore in this codebase.
 *
 * Usage:
 *   const { context, isLoading, fetchContext, setFilter, activeFilters } =
 *     useStudentContextStore();
 */

import { create } from "zustand";
import axiosInstance from "../lib/axios.js";

const DEFAULT_FILTERS = {
  courseId:   "all",   // "all" or a specific courseId string
  dateFrom:   null,    // Date | null
  dateTo:     null,    // Date | null
  difficulty: "all",  // "all" | "beginner" | "intermediate" | "advanced"
};

const useStudentContextStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  context:      null,   // Full StudentContext object from the API
  isLoading:    false,
  error:        null,
  activeFilters: { ...DEFAULT_FILTERS },

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Fetch the full student context from the API.
   * @param {string} userId - The authenticated user's _id
   */
  fetchContext: async (userId) => {
    if (!userId) return;

    set({ isLoading: true, error: null });

    try {
      const res = await axiosInstance.get(`/student-context/${userId}`);
      set({ context: res.data.context, isLoading: false });
    } catch (err) {
      console.error("Failed to load student context:", err);
      set({
        error:     err.response?.data?.message || "Failed to load context",
        isLoading: false,
      });
    }
  },

  /**
   * Targeted refresh for a single course slice — called after receiving a
   * context:updated Socket.IO event. Updates only that course in the existing
   * context, avoiding a full re-fetch.
   * @param {string} userId
   * @param {string} courseId
   */
  refreshCourseSlice: async (userId, courseId) => {
    if (!userId || !courseId) return;

    try {
      const res = await axiosInstance.get(
        `/student-context/${userId}/course/${courseId}/refresh`
      );
      const updatedCourse = res.data.courseContext;

      set((state) => {
        if (!state.context) return {};

        const updatedCourses = state.context.courses.map((c) =>
          c.courseId === courseId ? updatedCourse : c
        );

        // If the course wasn't in the list yet (first test taken), append it
        const found = updatedCourses.some((c) => c.courseId === courseId);
        if (!found) updatedCourses.push(updatedCourse);

        return {
          context: {
            ...state.context,
            courses:     updatedCourses,
            generatedAt: new Date().toISOString(),
          },
        };
      });
    } catch (err) {
      console.error("Failed to refresh course slice:", err);
    }
  },

  /**
   * Update a single filter key.
   * @param {"courseId"|"dateFrom"|"dateTo"|"difficulty"} key
   * @param {*} value
   */
  setFilter: (key, value) => {
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    }));
  },

  resetFilters: () => {
    set({ activeFilters: { ...DEFAULT_FILTERS } });
  },

  clearContext: () => {
    set({ context: null, error: null, activeFilters: { ...DEFAULT_FILTERS } });
  },

  // ─── Derived selectors (call from components) ─────────────────────────────

  /**
   * Returns test history for the currently selected course,
   * filtered by activeFilters (dateFrom, dateTo, difficulty).
   */
  getFilteredTestHistory: () => {
    const { context, activeFilters } = get();
    if (!context) return [];

    let tests = [];

    if (activeFilters.courseId === "all") {
      tests = context.courses.flatMap((c) => c.testHistory || []);
    } else {
      const course = context.courses.find(
        (c) => c.courseId === activeFilters.courseId
      );
      tests = course?.testHistory || [];
    }

    // Apply date range filter
    if (activeFilters.dateFrom) {
      tests = tests.filter(
        (t) => new Date(t.takenAt) >= new Date(activeFilters.dateFrom)
      );
    }
    if (activeFilters.dateTo) {
      tests = tests.filter(
        (t) => new Date(t.takenAt) <= new Date(activeFilters.dateTo)
      );
    }

    // Apply difficulty filter
    if (activeFilters.difficulty !== "all") {
      tests = tests.filter((t) => t.difficulty === activeFilters.difficulty);
    }

    return tests;
  },

  /**
   * Returns fingerprints for the currently selected course.
   */
  getFilteredFingerprints: () => {
    const { context, activeFilters } = get();
    if (!context) return [];

    if (activeFilters.courseId === "all") {
      return context.courses.flatMap((c) => c.fingerprints || []);
    }

    const course = context.courses.find(
      (c) => c.courseId === activeFilters.courseId
    );
    return course?.fingerprints || [];
  },

  /**
   * Returns the aggregate score for the currently selected course (or overall).
   */
  getActiveAggregateScore: () => {
    const { context, activeFilters } = get();
    if (!context) return null;

    if (activeFilters.courseId === "all") {
      return context.summary
        ? { averageScore: context.summary.overallAverageScore }
        : null;
    }

    const course = context.courses.find(
      (c) => c.courseId === activeFilters.courseId
    );
    return course?.aggregateScore || null;
  },
}));

export default useStudentContextStore;