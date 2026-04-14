import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";

function computeProficiency(averageScore) {
  if (averageScore === null || averageScore === undefined) return null;
  if (averageScore >= 80) return { label: "Mastery",     color: "#2D6A2D", bg: "#E8F5E8" };
  if (averageScore >= 60) return { label: "Proficient",  color: "#1A5276", bg: "#D6EAF8" };
  if (averageScore >= 40) return { label: "Developing",  color: "#784212", bg: "#FDEBD0" };
  return                         { label: "Beginner",    color: "#6B2737", bg: "#FADBD8" };
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden animate-pulse">
        <div className="h-44 bg-stone-200" />
        <div className="p-5 space-y-3">
            <div className="h-3 bg-stone-200 rounded w-1/3" />
            <div className="h-5 bg-stone-200 rounded w-3/4" />
            <div className="h-3 bg-stone-200 rounded w-full" />
            <div className="h-3 bg-stone-200 rounded w-2/3" />
            <div className="h-2 bg-stone-200 rounded-full mt-4" />
            <div className="h-10 bg-stone-200 rounded-xl mt-2" />
        </div>
    </div>
);

// ─── Course Card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, index, proficiencyMap = {} }) => {
    const navigate = useNavigate();
    const completed = course.realProgress?.completedCount ?? 0;
    const total = course.realProgress?.totalCount ?? course.videoCount ?? 0;
    const percentage = course.realProgress?.percentComplete ?? 0;
    const isEnrolled = completed > 0;
    const isCompleted = total > 0 && completed === total;

    const avgScore = proficiencyMap[course._id?.toString()];
    const proficiency = avgScore !== undefined ? computeProficiency(avgScore) : null;

    return (
        <div
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Thumbnail */}
            <div className="relative h-44 bg-stone-900 overflow-hidden">
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover opacity-90"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-20">▶</span>
                    </div>
                )}

                {/* Category badge */}
                {course.category && (
                    <span className="absolute top-3 left-3 bg-amber-400 text-black text-xs font-bold px-2.5 py-1 rounded-full tracking-wide">
                        {course.category}
                    </span>
                )}

                {/* Completed badge */}
                {isCompleted && (
                    <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        ✓ Done
                    </span>
                )}

                {/* Video count */}
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    {total} videos
                </span>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                <p className="text-stone-400 text-xs uppercase tracking-widest mb-1.5 font-medium">
                    {course.instructor ?? "Instructor"}
                </p>
                <h3
                    className="text-stone-900 text-lg leading-snug mb-2"
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                    {course.title}
                </h3>
                {proficiency && (
                    <div className="mb-2">
                        <span style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "500",
                            fontFamily: "DM Sans, sans-serif",
                            background: proficiency.bg,
                            color: proficiency.color,
                            letterSpacing: "0.02em",
                        }}>
                            {proficiency.label}
                        </span>
                    </div>
                )}
                <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                    {course.description}
                </p>

                {/* Progress */}
                {isEnrolled && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-stone-400 font-medium">
                                {completed}/{total} completed
                            </span>
                            <span
                                className={`text-xs font-bold ${isCompleted ? "text-green-500" : "text-amber-500"
                                    }`}
                            >
                                {percentage}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-green-500" : "bg-amber-400"
                                    }`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={() => navigate(`/course/${course._id}`)}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${isCompleted
                        ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        : isEnrolled
                            ? "bg-stone-900 text-white hover:bg-stone-700"
                            : "bg-amber-400 text-black hover:bg-amber-300"
                        }`}
                >
                    {isCompleted ? "Review Course" : isEnrolled ? "Continue →" : "Start Learning →"}
                </button>
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const CoursesPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // all | enrolled | completed

    const [dashboardSummary, setDashboardSummary] = useState(null);
    const [courseScores, setCourseScores] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, scoresRes] = await Promise.all([
                    axiosInstance.get("/dashboard/summary"),
                    axiosInstance.get("/dashboard/scores")
                ]);
                setDashboardSummary(summaryRes.data.summary);
                setCourseScores(scoresRes.data.scores);
            } catch (err) {
                // fail silently
            }
        };
        fetchDashboardData();
    }, []);

    const proficiencyMap = useMemo(() => {
        const map = {};
        const grouped = {};
        courseScores.forEach(r => {
            const key = r.courseId?.toString();
            if (!key) return;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r.totalScore);
        });
        Object.entries(grouped).forEach(([courseId, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            map[courseId] = Math.round(avg);
        });
        return map;
    }, [courseScores]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axiosInstance.get("/courses");
                const courses = res.data;

                // Fetch progress for all courses in parallel
                const progressResults = await Promise.allSettled(
                    courses.map(c => axiosInstance.get(`/progress/course/${c._id}`))
                );

                // Merge real progress into each course object
                const merged = courses.map((c, i) => {
                    const result = progressResults[i];
                    if (result.status === "fulfilled") {
                        return {
                            ...c,
                            realProgress: result.value.data
                        };
                    }
                    return { ...c, realProgress: { completedCount: 0, totalCount: 0, percentComplete: 0 } };
                });

                setCourses(merged);
            } catch (err) {
                console.error("Failed to load courses:", err);
                toast.error("Failed to load courses");
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const filtered = courses.filter((c) => {
        const matchesSearch =
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            (c.instructor ?? "").toLowerCase().includes(search.toLowerCase());

        const completedCount = c.realProgress?.completedCount ?? 0;
        const percentage =
            c.videoCount > 0
                ? Math.round(
                    (completedCount / c.videoCount) * 100
                )
                : 0;

        if (filter === "enrolled")
            return matchesSearch && completedCount > 0 && percentage < 100;
        if (filter === "completed") return matchesSearch && percentage === 100;
        return matchesSearch;
    });

    return (
        <div
            className="min-h-screen bg-[#faf9f6]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            {/* Google Fonts */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

            {/* Header */}
            <div className="border-b border-stone-200 bg-[#faf9f6] sticky top-0 z-10 backdrop-blur-sm bg-opacity-95">
                <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h1
                            className="text-stone-900 text-2xl"
                            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                        >
                            All Courses
                        </h1>
                        <p className="text-stone-400 text-sm mt-0.5">
                            {loading ? "Loading..." : `${courses.length} courses available`}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400 transition-colors pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                            🔍
                        </span>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="max-w-6xl mx-auto px-6 pb-4 flex gap-2">
                    {[
                        { id: "all", label: "All" },
                        { id: "enrolled", label: "In Progress" },
                        { id: "completed", label: "Completed" },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${filter === f.id
                                ? "bg-stone-900 text-white"
                                : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-5xl mb-4">📭</p>
                        <p
                            className="text-stone-800 text-xl mb-2"
                            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                        >
                            No courses found
                        </p>
                        <p className="text-stone-400 text-sm">
                            {search ? "Try a different search term" : "Check back soon for new content"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((course, i) => (
                            <CourseCard key={course._id} course={course} index={i} proficiencyMap={proficiencyMap} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesPage;