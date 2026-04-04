import { EAttackTypes } from "../enumerations/EAttackTypes";
import { EProtocols } from "../enumerations/EProtocols";
import { ESeverityLevels } from "../enumerations/ESeverityLevels";

export interface IAttackEvent {
    id: string;
    type: EAttackTypes;
    sourceIp: string;
    targetIp: string;
    severity: ESeverityLevels;
    timestamp: string; // ISO format
    payloadSize?: number; // in bytes, optional
    location?: { lat: number, lng: number }; // optional, for geolocation
    protocol: EProtocols;
}