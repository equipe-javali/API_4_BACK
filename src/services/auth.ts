import { Query } from "./postgres";
import { Pool } from "pg";
import { HashPassword, HashPasswordCompare } from './bcrypt';

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; 
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
    throw new Error("Erro ao carregar variável de ambiente: JWT_SECRET não está definido.");
}


interface UserPayload {
    id: string;
    email: string;
}

export async function authenticateUser(email: string, senha: string, bdConn: Pool) {
    const resultQuery = await Query(
        bdConn,
        "SELECT id, nome, email, senha FROM usuario WHERE email = $1;",
        [email]
    );

    if (resultQuery.length === 0) {
        throw new Error("Usuário não encontrado");
    }

    const user = resultQuery[0];
    const isPasswordValid = HashPasswordCompare(user.senha, senha);

    if (!isPasswordValid) {
        throw new Error("Senha inválida");
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        token
    };
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1]; // The token should be passed in the Authorization header

    if (!token) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden
        }

        req.user = user as UserPayload; // Save user data in the request
        next();
    });
}



export async function updateUser(id: string, bdConn: Pool, novoNome?: string, novoEmail?: string, novaSenha?: string) {
    const updates = [];
    const values = [];
    let index = 1;
    let senhaHashed: string | undefined;

    if (novoNome) {
        updates.push(`nome = $${index++}`);
        values.push(novoNome);
    }
    if (novoEmail) {
        updates.push(`email = $${index++}`);
        values.push(novoEmail);
    }
    if (novaSenha) {
        senhaHashed = HashPassword(novaSenha);
        updates.push(`senha = $${index++}`);
        values.push(senhaHashed);
    }

    if (updates.length === 0) {
        throw new Error("Nenhum dado para atualizar");
    }

    values.push(id);
    const resultQuery = await Query(
        bdConn,
        `UPDATE usuario SET ${updates.join(", ")} WHERE id = $${index} RETURNING id, nome, email, senha;`,
        values
    );

    if (resultQuery.length === 0) {
        throw new Error("Usuário não encontrado");
    }

    return resultQuery[0];
}