import { Request, Response, NextFunction } from "express";
import ApiError from "../exeptions/api-errors";
import tokenService from "../services/token-service";

export default function authMiddleware(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next(ApiError.UnathorizedError());
        }

        const accessToken = authHeader.split(" ")[1];
        if (!accessToken) {
            return next(ApiError.UnathorizedError());
        }

        const userData = tokenService.validateAccessToken(accessToken);
        if (!userData) {
            return next(ApiError.UnathorizedError());
        }

        req.user = userData;
        next();
    } catch (err) {
        return next(ApiError.UnathorizedError());
    }
}
