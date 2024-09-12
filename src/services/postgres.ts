import { Pool, QueryResultRow } from "pg";

require('dotenv-ts').config();

function StartConnection(): Pool {
    const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID, PORT } = process.env;

    if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD || !ENDPOINT_ID || !PORT) {
        throw "Erro ao carregar variáveis de ambiente";
    }

    return new Pool({
        host: PGHOST,
        user: PGUSER,
        password: PGPASSWORD,
        database: PGDATABASE,
        port: parseInt(PORT),
        ssl: true
    });
}

function EndConnection(conn: Pool) {
    conn.end();
}

async function Query<T extends QueryResultRow = any>(conn: Pool, query: string, valores: Array<any>): Promise<QueryResultRow> {
    try {
        const result = await conn.query<T>(
            query,
            valores
        );

        return result;
    } catch (err) {
        throw err;
    }
}

export {
    StartConnection,
    EndConnection,
    Query
}