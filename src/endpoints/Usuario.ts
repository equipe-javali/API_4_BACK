import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { ICadastrarUsuario } from "../types/Usuario";
import { IResponsePadrao } from "../types/Response";
import { HashPassword } from "../services/bcrypt";

const router = express.Router();

router.post(
    "/cadastrar", 
    async (req: Request, res: Response) => {
        const {
            nome,
            email,
            senha
        } = req.body as ICadastrarUsuario;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            // Hash da senha antes de armazenar no banco de dados
            const senhaHashed = HashPassword(senha);

            const resultQuery = await Query<ICadastrarUsuario>(
                bdConn,
                "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING *;",
                [nome, email, senhaHashed]
            );

            const retorno = {
                errors: [],
                msg: ["Usuário cadastrado com sucesso"],
                data: resultQuery.rows[0]
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao cadastrar usuário"],	
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

export {
    router as UsuarioRouter
};