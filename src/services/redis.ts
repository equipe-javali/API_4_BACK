import { createClient } from "redis";

async function StartConnection() {
    const { RDPASSWORD, RDHOST, RDPORT } = process.env;

    if (!RDPASSWORD || !RDHOST || !RDPORT) {
        throw "Erro ao carregar variáveis de ambiente redis";
    }

    const client = await createClient({
        password: RDPASSWORD,
        socket: {
            host: RDHOST,
            port: parseInt(RDPORT)
        }
    });
    return client;
}

async function EndConnection(client: any) {
    await client.disconnect();
    client.end();
}

export {
    StartConnection,
    EndConnection
}