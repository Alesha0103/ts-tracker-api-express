import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import router from "./router";
import errorMiddleware from "./middlewares/error-middleware";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use("/api", router);
app.use(errorMiddleware);

const start = async () => {
    try {
        if (!process.env.DB_URL) throw new Error("DB_URL_NOT_DEFINED");
        await mongoose.connect(process.env.DB_URL);
        app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`));
    } catch (err) {}
};

start();
