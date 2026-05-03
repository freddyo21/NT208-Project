import { z } from "zod";
import { EAttackTypes, EProtocols, ESeverityLevels } from "../types";
import { decimal96 } from "../utils";

/**
 * Schema for validating and transforming target attack data.
 * 
 * @typedef {Object} Target
 * @property {string} id - Unique identifier in UUIDv7 format
 * @property {string} ipAddress - IP address of the target (IPv4 or IPv6 format)
 * @property {number} lat - Latitude coordinate, range from -90 to 90
 * @property {number} lng - Longitude coordinate, range from -180 to 180
 * @property {string} [description] - Optional description of the target
 * 
 * @remarks
 * - Schema uses strict mode to reject unknown properties
 * - Transforms snake_case `ip_address` to camelCase `ipAddress`
 * - Coordinates are coerced to numbers and validated against geographic bounds
 * 
 * @example
 * const targetData = {
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   ip_address: "192.168.1.1",
 *   lat: 21.0285,
 *   lng: 105.8542,
 *   description: "Server in Hanoi"
 * };
 * const validatedTarget = TargetSchema.parse(targetData);
 */
export const TargetSchema = z.object({
    id: z.uuidv7(),
    ipAddress: z.ipv4().or(z.ipv6()),
    lat: z.coerce.number()
        .min(-90).max(90)
        .refine(decimal96, "Latitude must be DECIMAL(9,6)"),
    lng: z.coerce.number()
        .min(-180).max(180)
        .refine(decimal96, "Longitude must be DECIMAL(9,6)"),
    description: z.string().optional(),
}).strict();

export const AttackEventResponseSchema = z.object({
    id: z.uuidv7(),
    type: z.enum(EAttackTypes),
    sourceIp: z.ipv4().or(z.ipv6()),
    severity: z.enum(ESeverityLevels),
    timestamp: z.iso.datetime(), // ISO 8601 format
    payload: z.object({
        data: z.union([z.record(z.string(), z.any()), z.string()]),
        contentType: z.string(),
        size: z.number().int().nonnegative(),
        headers: z.record(z.string(), z.string()).optional(),
    }).optional(),
    protocol: z.enum(EProtocols).optional(),
    asset: TargetSchema,
}).refine((data) => {
    if (data.protocol === "ICMP" && data.payload && data.payload.size > 1024) {
        return false;
    }
    return true;
}, {
    message: "ICMP payload size is suspicious!",
    path: ["payload", "size"]
});

export const AttackHistoryResponseSchema = z.object({
    events: z.array(AttackEventResponseSchema),
    total: z.number().int().nonnegative(),
});

export const AttackEventDTOSchema = AttackEventResponseSchema.omit({ id: true });

export const AttackHistoryResponseDTOSchema = AttackHistoryResponseSchema.omit({ events: true }).extend({
    events: z.array(AttackEventDTOSchema)
});