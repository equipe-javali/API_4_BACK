import { Query } from "./postgres";
import { Pool } from "pg";
const { HashPasswordCompare, HashPassword } = require("./bcrypt");

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


export async function updateUser(id: string, bdConn: Pool, novoNome?: string, novoEmail?: string, novaSenha?: string) {
    const updates = [];
    const values = [];
    let index = 1;

    if (novoNome) {
        updates.push(`nome = $${index++}`);
        values.push(novoNome);
    }
    if (novoEmail) {
        updates.push(`email = $${index++}`);
        values.push(novoEmail);
    }
    if (novaSenha) {
        const senhaHashed = HashPassword(novaSenha);
        updates.push(`senha = $${index++}`);
        values.push(senhaHashed);
    }

    if (updates.length === 0) {
        throw new Error("Nenhum dado para atualizar");
    }

    values.push(id);
    const resultQuery = await Query(
        bdConn,
        `UPDATE usuario SET ${updates.join(", ")} WHERE id = $${index} RETURNING id, nome, email;`,
        values
    );

    if (resultQuery.rows.length === 0) {
        throw new Error("Usuário não encontrado");
    }

    return resultQuery.rows[0];
}