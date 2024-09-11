import { Client, connect } from "ts-postgres";

async function StartConnection(): Promise<Client> {
    return await connect({
        host: "localhost",
        port: 1234,
        user: "usuario",
        database: "banco",
        password: "senha"
    });
}

async function EndConnection(client: Client) {
    await client.end();
}

async function Query<T>(client: Client, query: string, valores: Array<any>): Promise<Array<T>> {
    try {
        const result = client.query<T>(
            query,
            valores
        );

        return [...(await result)];
    } catch (err) {
        throw err;
    }
}

export {
    StartConnection,
    EndConnection,
    Query
}