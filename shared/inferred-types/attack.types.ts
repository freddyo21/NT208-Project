import { z } from "zod";
import { AttackEventResponseSchema, AttackHistoryResponseSchema, AttackStatsRequestSchema, TargetSchema } from "../schemas";
import { SnakeToCamelObject } from "../utils";

export type AttackStats = z.infer<typeof AttackStatsRequestSchema>;

export type Target = z.infer<typeof TargetSchema>;

export type IAttackEvent = z.infer<typeof AttackEventResponseSchema>;

export type AttackEventDTO = Omit<IAttackEvent, "id">

export type AttackHistoryResponse = z.infer<typeof AttackHistoryResponseSchema>;

export type AttackHistoryResponseDTO = Omit<AttackHistoryResponse, "events"> & {
    events: Omit<IAttackEvent, "id">[];
};