import { Pool, QueryResultRow } from "pg";

function StartConnection(): Pool {
    const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID, PGPORT } = process.env;

    if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD || !ENDPOINT_ID || !PGPORT) {
        throw "Erro ao carregar variáveis de ambiente";
    }

    return new Pool({
        host: PGHOST,
        user: PGUSER,
        password: PGPASSWORD,
        database: PGDATABASE,
        port: parseInt(PGPORT),
        ssl: true
    });
}

function EndConnection(conn: Pool) {
    conn.end();
}

async function Query<T extends QueryResultRow = any>(conn: Pool, query: string, valores: Array<any>): Promise<QueryResultRow> {
    const result = await conn.query<T>(
        query,
        valores
    );

    return result;
}

export {
    StartConnection,
    EndConnection,
    Query
}