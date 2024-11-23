import { createClient } from "redis";

async function StartConnection() {
    try {
        const { RDPASSWORD, RDHOST, RDPORT } = process.env;

        if (!RDPASSWORD || !RDHOST || !RDPORT) {
            console.log("Erro ao carregar variáveis de ambiente redis");
            return null;
        };

        const client = await createClient({
            password: RDPASSWORD,
            socket: {
                host: RDHOST,
                port: parseInt(RDPORT)
            }
        }).connect();
        return client;
    } catch (err) {
        console.log(`Erro ao conectar com ambiente redis:`, err);
        return null;
    };
};

export {
    StartConnection
};