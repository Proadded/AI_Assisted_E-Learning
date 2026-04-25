import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export const generateToken = (userID, res) => {
    const token = jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: "7d" });


    return token;
}