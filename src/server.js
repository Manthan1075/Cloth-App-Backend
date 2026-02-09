import http from "http";
import app from "./app.js";
import connectDB from "./database/db.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 6001;
const server = http.createServer(app);

connectDB()
  .then(() => {
    server.listen(PORT, () => {});
    console.log("server is running on port 3000");
  })
  .catch((error) => console.log("Error While connect Database :", error));
