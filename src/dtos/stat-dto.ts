import { IStat } from "../models/user-model";

export default class StatDto {
    id;
    date;
    hours;
    comment;

    constructor(model: IStat) {
        this.id = model._id;
        this.date = model.date;
        this.hours = model.hours;
        this.comment = model.comment;
    }
}
