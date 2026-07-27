import express from "express";
import cors from "cors";
import productRouter from "./routes/product.routes.js";
import orderRouter from "./routes/order.routes.js";
import categoryRouter from "./routes/category.routes.js";
import heroSectionRouter from "./routes/heroSection.route.js";
import userRouter from "./routes/user.routes.js";
import variantRouter from "./routes/variant.route.js";
import transactionRouter from "./routes/transaction.route.js";
import reviewRouter from "./routes/review.routes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use("/api/product", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/category", categoryRouter);
app.use("/api/hero-section", heroSectionRouter);
app.use("/api/user", userRouter);
app.use("/api/variant", variantRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/reviews", reviewRouter);

app.get("/", (req, res) => {
  res.send("Welcome to CK FASHION API");
});

export default app;
