import { Pool, QueryResultRow } from "pg";

var pool: Pool;

async function checkConnection(): Promise<boolean> {
    try {
        const res = await pool.query('SELECT 1');
        return res.rowCount == null || res.rowCount > 0;
    } catch (error) {
        console.error('Error checking connection:', error);
        return false;
    }
};

function StartConnection(): Pool {
    try {
        const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT } = process.env;

        if (!PGHOST || !PGDATABASE || !PGUSER || !PGPASSWORD || !PGPORT) {
            console.log("Erro ao carregar variáveis de ambiente postgres");
            return new Pool({});
        };

        // console.log("pg", pool != undefined);
        if (pool == undefined || !checkConnection()) {
            console.log("nova conexão postgres");
            pool = new Pool({
                host: PGHOST,
                user: PGUSER,
                password: PGPASSWORD,
                database: PGDATABASE,
                port: parseInt(PGPORT),
                ssl: true,
                connectionTimeoutMillis: 0,
                idleTimeoutMillis: 0
            });
        }
        return pool;
    } catch (err) {
        console.log(`Erro ao conectar com ambiente postgres:`, err);
        return new Pool({});
    };
};

function EndConnection() {
    if (pool) {
        pool.end();
    }
};

async function Query<T extends QueryResultRow = any>(
    conn: Pool,
    query: string,
    valores: Array<any>
): Promise<T[]> {
    StartConnection();
    try {
        if (!query || typeof query !== "string") {
            throw new Error("Consulta SQL inválida ou não fornecida.");
        }

        if (!Array.isArray(valores)) {
            throw new Error("Os valores fornecidos não são um array.");
        }

        const sanitizedValues = valores.map((val) => {
            if (val === null || val === undefined) {
                return null;
            }
            if (typeof val === "string" && val.includes(";")) {
                throw new Error("Entrada inválida: valores não devem conter caracteres suspeitos.");
            }
            return val;
        });

        const result = await conn.query<T>(query, sanitizedValues);

        return result.rows;
    } catch (error) {
        console.error("Erro ao executar a consulta SQL:", error);
        throw error;
    };
};

export {
    StartConnection,
    EndConnection,
    Query
};