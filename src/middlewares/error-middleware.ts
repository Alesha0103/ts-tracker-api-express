import { Request, Response } from "express";
import ApiError from "../exeptions/api-errors";

function errorMiddleware(err: unknown, req: Request, res: Response): Response {
    if (err instanceof ApiError) {
        return res
            .status(err.status)
            .json({ message: err.message, errors: err.errors });
    }
    return res.status(500).json({ message: "UNDEFINED_SERVER_ERROR" });
}

export default errorMiddleware;
