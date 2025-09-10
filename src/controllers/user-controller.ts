import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import userService from "../services/user-service";
import ApiError from "../exeptions/api-errors";
import { AppError } from "../types";

class UserController {
    async registration(req: Request, res: Response, next: NextFunction) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(
                    ApiError.BadRequest(
                        AppError.E_VALIDATION_ERROR,
                        errors.array()
                    )
                );
            }

            const { email, password, isAdmin } = req.body;
            const userData = await userService.registration(
                email,
                password,
                isAdmin
            );

            res.cookie("refreshToken", userData.refreshToken, {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
            });

            return res.json(userData.user);
        } catch (err) {
            next(err);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const userData = await userService.login(email, password);

            res.cookie("accessToken", userData.accessToken, {
                maxAge: 0.5 * 60 * 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });

            res.cookie("refreshToken", userData.refreshToken, {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });

            res.cookie("userType", userData.user.isAdmin ? "ADMIN" : "USER", {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });

            return res.json(userData.user);
        } catch (err) {
            next(err);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.cookies;
            const token = await userService.logout(refreshToken);

            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            res.clearCookie("userType");

            return res.json(token);
        } catch (err) {
            next(err);
        }
    }

    async activate(req: Request, res: Response, next: NextFunction) {
        try {
            const activationLink = req.params.link;
            await userService.activate(activationLink);

            return res.redirect(`${process.env.CLIENT_URL}?activated=true`);
        } catch (err) {
            next(err);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.cookies;
            const userData = await userService.refresh(refreshToken);

            res.cookie("accessToken", userData.accessToken, {
                maxAge: 60 * 60 * 1000,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
            });
            res.cookie("refreshToken", userData.refreshToken, {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
            });

            return res.json(userData);
        } catch (err) {
            next(err);
        }
    }

    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await userService.getAllUsers(req.body);
            return res.json(users);
        } catch (err) {
            next(err);
        }
    }

    async editUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { projects, isAdmin } = req.body;

            const updatedUser = await userService.editUserUser(id, {
                projects,
                isAdmin,
            });

            if (!updatedUser) {
                return res.status(404).json({ message: "USER_NOT_FOUND" });
            }

            return res.json(updatedUser);
        } catch (err) {
            next(err);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deletedUser = await userService.deleteUser(id);

            if (!deletedUser) {
                return res.status(404).json({ message: "USER_NOT_FOUND" });
            }

            return res.json({ message: "USER_WAS_DELETED" });
        } catch (err) {
            next(err);
        }
    }

    async trackingHours(req: Request, res: Response, next: NextFunction) {
        try {
            const updatedUser = await userService.trackingUserHours(req.body);
            return res.json(updatedUser);
        } catch (err) {
            next(err);
        }
    }

    async getProjects(req: Request, res: Response, next: NextFunction) {
        try {
            const projects = await userService.getProjects(
                (req as any).user.id
            );
            return res.json(projects);
        } catch (err) {
            next(err);
        }
    }

    async getUserProject(req: Request, res: Response, next: NextFunction) {
        try {
            const projects = await userService.getUserProject(req.body);
            return res.json(projects);
        } catch (err) {
            next(err);
        }
    }

    async editStat(req: Request, res: Response, next: NextFunction) {
        try {
            const updatedUser = await userService.editStat(req.body);
            return res.json(updatedUser);
        } catch (err) {
            next(err);
        }
    }
}

export default new UserController();
