import jwt from "jsonwebtoken";
import { getKeys } from "../../utils/key-generator";
import { SocketAttackFlowConfig } from "./config";
import { LoginResponse } from "./types";

// Chon cach lay token theo thu tu uu tien: token co san -> login -> token demo.
export const resolveAccessToken = async (config: SocketAttackFlowConfig): Promise<string> => {
    if (config.accessToken) {
        return config.accessToken;
    }

    if (config.loginEmail && config.loginPassword) {
        return loginAndGetAccessToken(config);
    }

    return generateDemoAccessToken();
};

// Login qua API that neu user muon test bang tai khoan co trong database.
const loginAndGetAccessToken = async (config: SocketAttackFlowConfig): Promise<string> => {
    const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: config.loginEmail,
            password: config.loginPassword,
            rememberMe: false
        })
    });

    const body = await response.json().catch(() => ({})) as LoginResponse;

    if (!response.ok || !body.accessToken) {
        throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(body)}`);
    }

    return body.accessToken;
};

// Token demo giup script chay duoc ma khong phu thuoc seed database hay tai khoan login.
const generateDemoAccessToken = (): string => {
    const { privateKey } = getKeys();

    // Backend socket chi can JWT hop le va co claim sub de map thanh user id.
    return jwt.sign(
        {
            iss: process.env.JWT_ISSUER,
            sub: "socket-demo-user",
            aud: process.env.JWT_ISSUER,
            email: "socket-demo@example.test",
            role: "operator",
            status: "active"
        },
        privateKey,
        {
            algorithm: "ES256",
            expiresIn: "15m"
        }
    );
};
