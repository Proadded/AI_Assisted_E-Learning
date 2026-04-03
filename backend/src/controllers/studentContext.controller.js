/**
 * studentContext.controller.js
 *
 * Thin HTTP wrapper over studentContext.service.js.
 * Validates ownership before serving — a student may only fetch their own context.
 * Admin role bypass is included for future instructor/admin dashboards.
 */

import { buildStudentContext, refreshCourseContext } from "../services/studentContext.service.js";

/**
 * GET /api/student-context/:studentId
 * Returns the full StudentContext object for the given studentId.
 *
 * Access rules:
 *   - student role: req.user._id must equal :studentId
 *   - admin role: unrestricted
 *   - instructor role: restricted (instructor-facing endpoints come in Phase 3)
 */
export const getStudentContext = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Ownership check — students can only access their own context
    if (
      req.user.role === "student" &&
      req.user._id.toString() !== studentId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const context = await buildStudentContext(studentId);
    return res.status(200).json({ context });
  } catch (error) {
    console.log("Error in getStudentContext controller:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/student-context/:studentId/course/:courseId/refresh
 * Lightweight refresh for a single course slice.
 * Called by the frontend after receiving a context:updated Socket.IO event.
 */
export const refreshCourseSlice = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    if (
      req.user.role === "student" &&
      req.user._id.toString() !== studentId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const courseContext = await refreshCourseContext(studentId, courseId);

    if (!courseContext) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json({ courseContext });
  } catch (error) {
    console.log("Error in refreshCourseSlice controller:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};