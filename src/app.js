import express from "express";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import heroSectionRouter from "./routes/heroSection.route.js";
import AdminRouter from "./routes/admin.routes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/product", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/category", categoryRouter);
app.use("/api/hero-section", heroSectionRouter);
app.use("/api/admin", AdminRouter);

app.get("/", (req, res) => {
  res.send("Welcome to CK FASHION API");
});

export default app;
