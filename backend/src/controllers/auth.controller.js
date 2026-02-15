import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import Tutor from "../models/tutor.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullName, email, password, confirmPassword, role} = req.body;
  try {
    if(!fullName || !email || !password || !confirmPassword || !role){
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate role
    if (!role || !["student", "instructor"].includes(role)) {
      return res.status(400).json({ message: "Role must be either 'student' or 'instructor'" });
    }

    // hash password
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
      role: role
    });

    if (newUser) {
      const savedUser = await newUser.save();
      
      // Create corresponding Student or Tutor record
      if (role === "student") {
        await Student.create({
          userId: savedUser._id,
          courseSubscribed: "",
          educationLevel: "",
        });
      } else if (role === "instructor") {
        await Tutor.create({
          userId: savedUser._id,
          subjectsTeaching: [],
          qualifications: "",
        });
      }
      
      //generate jwt token
      generateToken(savedUser._id, res);
      return res.status(201).json({ 
        _id: savedUser._id,
        fullName: savedUser.fullName,
        password: savedUser.password,
        email: savedUser.email,
        role: savedUser.role,
       });

       
    }
    else{
      return res.status(400).json({ message: "Invalid user data" });
    }
    
  } catch (error) {
    console.log("Error in signup controller:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //generate jwt token
    generateToken(user._id, res);
    return res.status(200).json({ 
      _id: user._id,
      fullName: user.fullName,
      password: user.password,
      email: user.email,
      role: user.role,
     });
  } catch (error) {
    console.log("Error in login controller:", error.message);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt", "", {maxAge: 0, });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller:", error.message);
    return res.status(500).json({ message: "Internal Server error" });
  }
};

