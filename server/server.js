const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const researchRoutes = require("./routes/researchRoutes");

const app = express();

// Allowed frontend origins
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:4173",
    process.env.CLIENT_URL
].filter(Boolean);

// Middleware
app.use(cors({
    origin: allowedOrigins
}));

app.use(express.json());

// Default API route
app.get("/", (req, res) => {
    res.json({
        message: "ResearchHub API is running"
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/research", researchRoutes);

// Start server after connecting to MongoDB
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
