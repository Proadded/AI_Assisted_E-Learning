import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export const generateToken = (userID, res) => {
    const token = jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true, // prevent XSS attacks:-- cannot be accessed by client-side JavaScript
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // allow cross-domain in production
        secure: process.env.NODE_ENV === "production", // only send cookie over HTTPS in production
    })

    return token;
}