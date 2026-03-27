import { ESeverityLevel } from "../enumerations/ESeverityLevel";

export interface IAttackEvent {
    id: string; // UUID v4
    attack_type: string;
    severity: ESeverityLevel;
    timestamp: string; // ISO string
    source_ip: string;
    dest_ip: string;
    lat: number;
    lng: number;
};