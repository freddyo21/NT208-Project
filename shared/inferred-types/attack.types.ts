import { z } from "zod";
import { AttackEventDTOSchema, AttackEventResponseSchema, AttackHistoryResponseDTOSchema, AttackHistoryResponseSchema, AttackStatsRequestSchema, TargetSchema } from "../schemas";

export type AttackStats = z.infer<typeof AttackStatsRequestSchema>;

export type Target = z.infer<typeof TargetSchema>;

export type IAttackEvent = z.infer<typeof AttackEventResponseSchema>;

export type AttackEventDTO = z.infer<typeof AttackEventDTOSchema>;

export type AttackHistoryResponse = z.infer<typeof AttackHistoryResponseSchema>;

export type AttackHistoryResponseDTO = z.infer<typeof AttackHistoryResponseDTOSchema>;