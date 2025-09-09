import UserModel from "../models/user-model";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import mailService from "./mail-service";
import tokenService from "./token-service";
import UserDto from "../dtos/user-dto";
import ProjectDto from "../dtos/project-dto";
import StatDto from "../dtos/stat-dto";
import ApiError from "../exeptions/api-errors";
import dayjs from "dayjs";
import {
    AppError,
    IEditStatBody,
    IGetAllUsersBody,
    IGetUserProjectBody,
    ITrackingBody,
    UserActivity,
    UserTypes,
} from "../types";

class UserService {
    async registration(email: string, password: string, isAdmin: boolean) {
        const candidate = await UserModel.findOne({ email });
        if (candidate) {
            throw ApiError.BadRequest(AppError.USER_ALREADY_EXISTED);
        }

        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuidv4();

        const user = await UserModel.create({
            email,
            isAdmin,
            password: hashPassword,
            activationLink,
        });

        await mailService.sendActivationMail(
            email,
            `${process.env.API_URL}/api/activate/${activationLink}`,
            password
        );

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return { ...tokens, user: userDto };
    }

    async activate(activationLink: string) {
        const user = await UserModel.findOne({ activationLink });
        if (!user) {
            throw ApiError.BadRequest(AppError.INJURED_LINK);
        }
        user.isActivated = true;
        await user.save();
    }

    async login(email: string, password: string) {
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw ApiError.BadRequest(AppError.USER_NOT_FOUND);
        }

        const isPassEquels = await bcrypt.compare(password, user.password);
        if (!isPassEquels) {
            throw ApiError.BadRequest(AppError.E_VALIDATION_ERROR);
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return { ...tokens, user: userDto };
    }

    async logout(refreshToken: string) {
        return tokenService.removeToken(refreshToken);
    }

    async refresh(refreshToken: string) {
        if (!refreshToken) {
            throw ApiError.UnathorizedError();
        }

        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDB = await tokenService.findToken(refreshToken);

        if (
            !userData ||
            typeof userData === "string" ||
            !("id" in userData) ||
            !tokenFromDB
        ) {
            throw ApiError.UnathorizedError();
        }

        const user = await UserModel.findById(userData.id);
        if (!user) {
            throw ApiError.BadRequest(AppError.USER_NOT_FOUND);
        }

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return { ...tokens, user: userDto };
    }

    async getAllUsers(body: IGetAllUsersBody, limit = 10) {
        const { page, email, userTypes, userActivity, projects } = body;
        const skip = (page - 1) * limit;

        const escapeRegex = (str: string) =>
            str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const filter: Record<string, any> = {};

        if (email) {
            filter.email = { $regex: escapeRegex(email), $options: "i" };
        }

        if (userTypes?.length) {
            const conditions = [];
            if (userTypes.includes(UserTypes.ADMIN))
                conditions.push({ isAdmin: true });
            if (userTypes.includes(UserTypes.USER))
                conditions.push({ isAdmin: false });
            filter.$and = filter.$and || [];
            filter.$and.push({ $or: conditions });
        }

        if (userActivity?.length) {
            const conditions = [];
            if (userActivity.includes(UserActivity.ACTIVE))
                conditions.push({ isActivated: true });
            if (userActivity.includes(UserActivity.DISABLE))
                conditions.push({ isActivated: false });
            filter.$and = filter.$and || [];
            filter.$and.push({ $or: conditions });
        }

        if (projects?.length) {
            filter.$and = filter.$and || [];
            filter.$and.push({ "projects.name": { $in: projects } });
        }

        const [users, total] = await Promise.all([
            UserModel.find(filter).skip(skip).limit(limit),
            UserModel.countDocuments(filter),
        ]);

        const updatedUsers = users.map((user) => ({
            id: user.id,
            email: user.email,
            isActivated: user.isActivated,
            totalHours: user.totalHours,
            projects: user.projects.map((p) => new ProjectDto(p)),
            isAdmin: user.isAdmin,
        }));

        return {
            users: updatedUsers,
            pages: Math.ceil(total / limit),
            currentPage: page,
        };
    }

    async editUserUser(
        id: string,
        updateData: { projects?: string[]; isAdmin?: boolean }
    ) {
        const user = await UserModel.findById(id);
        if (!user) return null;

        if (updateData.projects && Array.isArray(updateData.projects)) {
            const incomingNames = updateData.projects;

            user.projects.forEach((project) => {
                project.isDisabled = !incomingNames.includes(project.name);
            });

            incomingNames.forEach((name) => {
                const exists = user.projects.find((p) => p.name === name);
                if (!exists) {
                    user.projects.unshift({
                        name,
                        createdAt: dayjs().format("YYYY-MM-DD"),
                        updatedAt: dayjs().format("YYYY-MM-DD"),
                        isDisabled: false,
                        hours: 0,
                    } as any);
                }
            });
        }

        user.totalHours = user.projects.reduce(
            (total, project) =>
                total + project.stats.reduce((sum, s) => sum + s.hours, 0),
            0
        );

        user.isAdmin = updateData.isAdmin ?? user.isAdmin;

        await user.save();

        return {
            id: user.id,
            email: user.email,
            isActivated: user.isActivated,
            trackedHours: user.totalHours,
            projects: user.projects.map((p) => new ProjectDto(p)),
            isAdmin: user.isAdmin,
        };
    }

    async deleteUser(id: string) {
        return UserModel.findByIdAndDelete(id);
    }

    async trackingUserHours(body: ITrackingBody) {
        const { userId, projectId, hours, date, comment } = body;
        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.BadRequest(AppError.USER_NOT_FOUND);

        const project = user.projects.find(
            (p) => p._id?.toString() === projectId
        );
        if (!project) throw ApiError.BadRequest(AppError.PROJECT_NOT_FOUND);

        const targetDate = date || dayjs().format("YYYY-MM-DD");

        const totalForDay = user.projects.reduce((sum, p) => {
            return (
                sum +
                p.stats
                    .filter((st) => st.date === targetDate)
                    .reduce((s, st) => s + st.hours, 0)
            );
        }, 0);

        if (totalForDay + Number(hours) > 24) {
            throw ApiError.BadRequest(AppError.DAY_LIMIT);
        }

        project.hours = Number(project.hours) + Number(hours);
        project.updatedAt = targetDate;

        project.stats.unshift({
            date: targetDate,
            hours: Number(hours),
            comment,
        } as any);

        user.totalHours = user.projects.reduce(
            (sum, p) => sum + p.stats.reduce((s, st) => s + st.hours, 0),
            0
        );

        await user.save();

        return {
            id: user.id,
            email: user.email,
            totalHours: user.totalHours,
            projects: user.projects.map((p) => new ProjectDto(p)),
        };
    }

    async getProjects(userId: string) {
        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.BadRequest(AppError.USER_NOT_FOUND);

        return user.projects
            .filter((p) => !p.isDisabled)
            .map((p) => new ProjectDto(p));
    }

    async getUserProject(body: IGetUserProjectBody) {
        const {
            userId,
            projectId,
            page = 1,
            limit = 10,
            thisWeek,
            thisMonth,
            prevWeek,
            prevMonth,
            dateFrom,
            dateTo,
        } = body;

        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.BadRequest(AppError.USER_NOT_FOUND);

        const foundProject = user.projects.find(
            (project) => project._id?.toString() === projectId
        );
        if (!foundProject)
            throw ApiError.BadRequest(AppError.PROJECT_NOT_FOUND);

        let stats = [...foundProject.stats].sort(
            (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
        );

        if (thisWeek)
            stats = stats.filter((s) => dayjs(s.date).isSame(dayjs(), "week"));
        if (thisMonth)
            stats = stats.filter((s) => dayjs(s.date).isSame(dayjs(), "month"));
        if (prevWeek)
            stats = stats.filter((s) =>
                dayjs(s.date).isSame(dayjs().subtract(1, "week"), "week")
            );
        if (prevMonth)
            stats = stats.filter((s) =>
                dayjs(s.date).isSame(dayjs().subtract(1, "month"), "month")
            );
        if (dateFrom)
            stats = stats.filter(
                (s) => s.date >= dayjs(dateFrom).format("YYYY-MM-DD")
            );
        if (dateTo)
            stats = stats.filter(
                (s) => s.date <= dayjs(dateTo).format("YYYY-MM-DD")
            );

        const totalItems = stats.length;
        const pages = Math.ceil(totalItems / limit);
        const start = (page - 1) * limit;
        const updatedStats = stats.map((s) => new StatDto(s));
        const items = updatedStats.slice(start, start + limit);

        const project = new ProjectDto(foundProject);

        return { ...project, stats: { currentPage: page, pages, items } };
    }

    async editStat(body: IEditStatBody) {
        const { userId, projectId, statId, hours, date, comment } = body;
        const user = await UserModel.findById(userId);
        if (!user) throw ApiError.BadRequest(AppError.USER_NOT_FOUND);

        const project = user.projects.find(
            (p) => p._id?.toString() === projectId
        );
        if (!project) throw ApiError.BadRequest(AppError.PROJECT_NOT_FOUND);

        const stat = project.stats.find((s) => s._id?.toString() === statId);
        if (!stat) throw ApiError.BadRequest(AppError.STAT_NOT_FOUND);

        stat.hours = hours;
        stat.date = date;
        stat.comment = comment;

        await user.save();
        return new ProjectDto(project);
    }
}

export default new UserService();
