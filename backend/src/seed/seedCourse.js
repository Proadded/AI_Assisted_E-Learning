import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/course.model.js";
import Video from "../models/video.model.js";

dotenv.config();

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clean up existing data
    await Course.deleteMany({ title: "JavaScript for Beginners" });

    const course = await Course.create({
        title: "JavaScript for Beginners",
        description: "A complete beginner's guide to JavaScript — covering variables, functions, DOM, events and more.",
        subject: "JavaScript",
        thumbnail: "https://img.youtube.com/vi/ajdRvxDWH4w/maxresdefault.jpg",
        level: "Beginner",
        videoCount: 0, // will update below
    });

    console.log("Course created:", course._id);

    // Fill this array with actual videos from the playlist
    const videoData = [
        { title: "Introduction to JavaScript", youtubeUrl: "https://youtu.be/ajdRvxDWH4w?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 4870, order: 1 },
        { title: "Operators and Conditional Statements", youtubeUrl: "https://youtu.be/Zg4-uSjxosE?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 4606, order: 2 },
        { title: "Loops and Strings", youtubeUrl: "https://www.youtube.com/watch?v=UmRtFFSDSFo&list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 4868, order: 3 },
        { title: "Arrays", youtubeUrl: "https://youtu.be/gFWhbjzowrM?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 3625, order: 4 },
        { title: "Functions & Methods", youtubeUrl: "https://youtu.be/P0XMXqDGttU?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 4149, order: 5 },
        { title: "DOM - Document Object Model", youtubeUrl: "https://youtu.be/7zcXPCt8Ck0?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 4149, order: 6 },
        { title: "DOM (PART-2)", youtubeUrl: "https://youtu.be/fXAGTOZ25H8?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 1675, order: 7 },
        { title: "Events in JavaScript", youtubeUrl: "https://youtu.be/_i-uLJAh79U?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 1992, order: 8 },
        { title: "Tic Tac Toe Game in JavaScript", youtubeUrl: "https://youtu.be/SqrppLEljkY?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 3214, order: 9 },
        { title: "MiniProject - Stone, Paper & Scissors Game", youtubeUrl: "https://youtu.be/_V33HCZWLDQ?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 2825, order: 10 },
        { title: "Classes & Objects", youtubeUrl: "https://youtu.be/N-O4w6PynGY?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 3642, order: 11 },
        { title: "Callbacks, Promises & Async Await", youtubeUrl: "https://youtu.be/d3jXofmQm44?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 5034, order: 12 },
        { title: "Fetch API with Project", youtubeUrl: "https://youtu.be/CyGodpqcid4?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW", duration: 4634, order: 13 }
    ];

    const videos = await Video.insertMany(
        videoData.map(v => ({
            ...v,
            subject: "JavaScript",
            topic: "JavaScript Basics",
            courseId: course._id,
        }))
    );

    await Course.findByIdAndUpdate(course._id, { videoCount: videos.length });
    console.log(`Seeded ${videos.length} videos for course: ${course._id}`);

    await mongoose.disconnect();
    console.log("Done.");
};

seed().catch(err => { console.error(err); process.exit(1); });