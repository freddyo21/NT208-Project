import "dotenv/config";

import { assertBackendIsRunning, postAttackEvent } from "./attack-api";
import { resolveAccessToken } from "./auth-token";
import { loadConfig } from "./config";
import { connectSocket, subscribeAttackStream, waitForAttackEvent } from "./socket-client";

// Entry point nay chi dieu phoi flow test, logic chi tiet nam o cac file helper rieng.
const main = async () => {
    const config = loadConfig();

    // Lay token theo thu tu uu tien: ACCESS_TOKEN -> login bang email/password -> tu tao token demo.
    const accessToken = await resolveAccessToken(config);

    // Kiem tra backend dang chay truoc khi connect socket de bao loi de hieu hon.
    await assertBackendIsRunning(config);

    // Tao ket noi socket bang token da co.
    const socket = await connectSocket(config, accessToken);

    try {
        // Dang ky filter tren socket truoc khi POST attack de khong bi miss event.
        await subscribeAttackStream(socket, config);

        // Gan listener truoc khi POST vi backend co the broadcast attack:new ngay lap tuc.
        const receivedAttackPromise = waitForAttackEvent(socket, config);

        // Goi endpoint test attack, backend se broadcast lai qua socket.
        const postedAttack = await postAttackEvent(config, accessToken);

        // Doi event attack:new tu socket de xac nhan flow chay end-to-end.
        const receivedAttack = await receivedAttackPromise;

        console.log("[socket-test] Posted attack:", postedAttack);
        console.log("[socket-test] Received attack:new:", receivedAttack);
        console.log("[socket-test] Attack socket flow OK");
    } finally {
        socket.disconnect();
    }
};

main().catch((error) => {
    console.error("[socket-test] Attack socket flow FAILED");
    console.error(error);
    process.exitCode = 1;
});
