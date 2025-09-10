import { Document, Types } from "mongoose";

export enum AppError {
    USER_NOT_FOUND = "USER_NOT_FOUND",
    DB_URL_NOT_DEFINED = "DB_URL_NOT_DEFINED",
    USER_ALREADY_EXISTED = "USER_ALREADY_EXISTED",
    E_VALIDATION_ERROR = "E_VALIDATION_ERROR",
    USER_WAS_DELETED = "USER_WAS_DELETED",
    NOT_AUTORIZED = "NOT_AUTORIZED",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    UNDEFINED_SERVER_ERROR = "UNDEFINED_SERVER_ERROR",
    INJURED_LINK = "INJURED_LINK",
    PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND",
    DAY_LIMIT = "DAY_LIMIT",
    STAT_NOT_FOUND = "STAT_NOT_FOUND",
}

export enum UserTypes {
    ADMIN = "ADMIN",
    USER = "USER",
}

export enum UserActivity {
    ACTIVE = "ACTIVE",
    DISABLE = "DISABLE",
}

export interface IStat {
    _id?: Types.ObjectId;
    date: string;
    hours: number;
    comment?: string;
}

export interface IProject {
    _id?: Types.ObjectId;
    name: string;
    createdAt: string;
    updatedAt: string;
    hours: number;
    stats: IStat[];
    isDisabled: boolean;
}

export interface IUser extends Document {
    _id: string;
    email: string;
    password: string;
    isActivated: boolean;
    isAdmin: boolean;
    activationLink?: string;
    totalHours: number;
    projects: IProject[];
}

export interface ITokens {
    accessToken: string;
    refreshToken: string;
}

export interface IGetAllUsersBody {
    page: number;
    email?: string;
    userTypes?: UserTypes[];
    userActivity?: UserActivity[];
    projects?: string[];
}

export interface ITrackingBody {
    userId: string;
    projectId: string;
    hours: number;
    date?: string;
    comment?: string;
}

export interface IGetUserProjectBody {
    userId: string;
    projectId: string;
    page?: number;
    limit?: number;
    thisWeek?: boolean;
    thisMonth?: boolean;
    prevWeek?: boolean;
    prevMonth?: boolean;
    dateFrom?: string;
    dateTo?: string;
}

export interface IEditStatBody {
    userId: string;
    projectId: string;
    statId: string;
    hours: number;
    date: string;
    comment: string;
}
