import { IUser } from "../types";
import ProjectDto from "./project-dto";

export default class UserDto {
    email;
    id;
    isActivated;
    isAdmin;
    totalHours;
    projects;

    constructor(model: IUser) {
        this.email = model.email;
        this.id = model._id.toString();
        this.isActivated = model.isActivated;
        this.isAdmin = model.isAdmin;
        this.totalHours = model.totalHours;
        this.projects = model.projects.map((p) => new ProjectDto(p));
    }
}
