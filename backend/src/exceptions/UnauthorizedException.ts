import { Exception } from "./Exception";

export class UnauthorizedException extends Exception {
    constructor(message: string = "Unauthorized access", details: any = null) {
        super(message, 401, details);
        this.name = "UnauthorizedException";
    }
}