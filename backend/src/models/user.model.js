import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        confirmPassword: {
            type: String,
            required: true,
            minlength: 6,
            validate: {
                validator: function(value) {
                    return value === this.password;
                },
                message: "Passwords do not match",
            },
        },
        role: {
            type: String,
            enum: ["student", "instructor", "admin"],
            default: "student",
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;