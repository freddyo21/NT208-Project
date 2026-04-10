import { z } from "zod";
import { AttackStatsResponseSchema } from "../schemas";

export type AttackStatsResponse = z.infer<typeof AttackStatsResponseSchema>;