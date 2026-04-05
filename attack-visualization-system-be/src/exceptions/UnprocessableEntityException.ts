import { Exception } from "./Exception";

export class UnprocessableEntityException extends Exception {
    constructor(message = "Data format is invalid for processing") {
        super(message, 422);
    }
}