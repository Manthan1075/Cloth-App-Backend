import express from "express";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";

const app = express();

app.use("/api/product", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/category", categoryRouter);

export default app;
