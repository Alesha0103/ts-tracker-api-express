import { Schema, model, Document, Types } from "mongoose";
import { IProject, IStat, IUser } from "../types";

const StatSchema = new Schema<IStat>({
    date: { type: String, required: true },
    hours: { type: Number, required: true },
    comment: { type: String },
});

const ProjectSchema = new Schema<IProject>({
    name: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
    hours: { type: Number, default: 0 },
    stats: { type: [StatSchema], default: [] },
    isDisabled: { type: Boolean, required: true, default: false },
});

const UserSchema = new Schema<IUser>({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isActivated: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    activationLink: { type: String },
    totalHours: { type: Number, default: 0 },
    projects: { type: [ProjectSchema], default: [] },
});

export default model<IUser>("User", UserSchema);
