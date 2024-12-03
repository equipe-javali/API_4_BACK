import { createClient } from "redis";

var redis: any;

async function checkRedisConnection(): Promise<boolean> {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch (error) {
        console.error('Redis connection error:', error);
        return false;
    }
};

async function StartConnection() {
    try {
        const { RDPASSWORD, RDHOST, RDPORT } = process.env;

        if (!RDPASSWORD || !RDHOST || !RDPORT) {
            console.log("Erro ao carregar variáveis de ambiente redis");
            return null;
        };

        // console.log("redis", redis != undefined);
        if (redis == undefined || !checkRedisConnection()) {
            console.log("nova conexão redis");
            redis = await createClient({
                password: RDPASSWORD,
                socket: {
                    host: RDHOST,
                    port: parseInt(RDPORT)
                }
            }).connect();
        }

        const client = redis;
        return client;
    } catch (err) {
        console.log(`Erro ao conectar com ambiente redis:`, err);
        return null;
    };
};

async function EndConnection() {
    if (redis) {
        await redis.quit();
    }
};

export {
    StartConnection,
    EndConnection
};