import dotenv from "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./database/db.js";

const PORT = process.env.PORT || 6001;
const server = http.createServer(app);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log("server is running on port :", PORT);
    });
  })
  .catch((error) => console.log("Error While connect Database :", error));
