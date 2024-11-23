import { Pool, QueryResultRow } from "pg";

function StartConnection(): Pool {
    try {
        const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID, PGPORT } = process.env;

        if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD || !ENDPOINT_ID || !PGPORT) {
            console.log("Erro ao carregar variáveis de ambiente postgres");
            return new Pool({});
        };
        return new Pool({
            host: PGHOST,
            user: PGUSER,
            password: PGPASSWORD,
            database: PGDATABASE,
            port: parseInt(PGPORT),
            ssl: true
        });
    } catch (err) {
        console.log(`Erro ao conectar com ambiente postgres:`, err);
        return new Pool({});
    };
};

function EndConnection(conn: Pool) {
    conn.end();
};

async function Query<T extends QueryResultRow = any>(conn: Pool, query: string, valores: Array<any>): Promise<QueryResultRow> {
    const result = await conn.query<T>(
        query,
        valores
    );

    return result;
};

export {
    StartConnection,
    EndConnection,
    Query
};