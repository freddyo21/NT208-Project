import { z } from "zod";
import { snakeToCamelTransform } from "../utils";

export const ErrorSchema = z.object({
    status: z.number().int().min(400).max(599),
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())])
    ).optional(),
}).transform(snakeToCamelTransform);