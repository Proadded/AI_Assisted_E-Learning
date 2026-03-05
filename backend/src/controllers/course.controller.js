import Course from "../models/course.model.js";

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json(courses);
    } catch (error) {
        console.log("Error in getAllCourses controller:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        res.status(200).json(course);
    } catch (error) {
        console.log("Error in getCourseById controller:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
