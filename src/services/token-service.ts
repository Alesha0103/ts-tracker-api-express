import jwt, { JwtPayload } from "jsonwebtoken";
import tokenModel from "../models/token-model";
import { ITokens } from "../types";

class TokenService {
    generateTokens(payload: object): ITokens {
        const accessToken = jwt.sign(
            payload,
            process.env.JWT_ACCESS_SECRET as string,
            {
                expiresIn: "1d",
            }
        );
        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_REFRESH_SECRET as string,
            {
                expiresIn: "30d",
            }
        );
        return { accessToken, refreshToken };
    }

    validateAccessToken(token: string): string | JwtPayload | null {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
        } catch {
            return null;
        }
    }

    validateRefreshToken(token: string): string | JwtPayload | null {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
        } catch {
            return null;
        }
    }

    async saveToken(userId: string, refreshToken: string) {
        const tokenData = await tokenModel.findOne({ user: userId });
        if (tokenData) {
            tokenData.refreshToken = refreshToken;
            return tokenData.save();
        }
        const token = await tokenModel.create({ user: userId, refreshToken });
        return token;
    }

    async removeToken(refreshToken: string) {
        return tokenModel.deleteOne({ refreshToken });
    }

    async findToken(refreshToken: string) {
        return tokenModel.findOne({ refreshToken });
    }
}

export default new TokenService();
