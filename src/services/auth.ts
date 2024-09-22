import { Query } from "./postgres";
import { Pool } from "pg";
const { HashPasswordCompare } = require("./bcrypt");

export async function authenticateUser(email: string, senha: string, bdConn: Pool) {
    const resultQuery = await Query(
        bdConn,
        "SELECT id, nome, email, senha FROM usuario WHERE email = $1;",
        [email]
    );

    if (resultQuery.rows.length === 0) {
        throw new Error("Usuário não encontrado");
    }

    const user = resultQuery.rows[0];
    const isPasswordValid = HashPasswordCompare(user.senha, senha);

    if (!isPasswordValid) {
        throw new Error("Senha inválida");
    }

    return {
        id: user.id,
        nome: user.nome,
        email: user.email
    };
}