import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
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

export const login = (req, res) => {
  res.send("Login route");
};

export const logout = (req, res) => {
  res.send("Logout route");
};

