require("dotenv").config();
const express = require("express");
const cors = require("cors");

const groupRoutes = require("./routes/groupRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 THIS LINE CONNECTS /groups ROUTES
app.use("/groups", groupRoutes);
app.use("/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
