import { IProject } from "../models/user-model";

export default class ProjectDto {
    id;
    name;
    createdAt;
    updatedAt;
    hours;
    isDisabled;

    constructor(model: IProject) {
        this.id = model._id?.toString();
        this.name = model.name;
        this.createdAt = model.createdAt;
        this.updatedAt = model.updatedAt;
        this.hours = model.hours;
        this.isDisabled = model.isDisabled;
    }
}
