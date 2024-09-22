//usuario.ts

import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { ICadastrarUsuario, IDeletarUsuario } from "../types/Usuario";
import { IResponsePadrao } from "../types/Response";
const { HashPassword } = require("../services/bcrypt");
import { authenticateUser } from "../services/auth";


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
                "INSERT INTO usuario (nome, email, senha) VALUES ($1, $2, $3) RETURNING *;",
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

router.post(
    "/login",
    async (req: Request, res: Response) => {
        const { email, senha } = req.body;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const user = await authenticateUser(email, senha, bdConn);

            const retorno = {
                errors: [],
                msg: ["Login bem-sucedido"],
                data: user
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao fazer login"],
                data: null
            } as IResponsePadrao;
            res.status(401).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);


router.get(
    "/usuarios",
    async (req: Request, res: Response) => {
        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query(
                bdConn,
                "SELECT id, nome, email FROM usuario;",
                []
            );

            const retorno = {
                errors: [],
                msg: ["Lista de usuários"],
                data: resultQuery.rows
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar usuários"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);


// Rota para visualizar perfil do usuário pelo ID
router.get(
    "/:usuarioId",
    async (req: Request, res: Response) => {
        const userId = parseInt(req.params.usuarioId);

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query(
                bdConn,
                "SELECT id, nome, email FROM usuario WHERE id = $1;",
                [userId]
            );

            if (resultQuery.rows.length === 0) {
                return res.status(404).send({
                    errors: ["Usuário não encontrado"],
                    msg: [],
                    data: null
                } as IResponsePadrao);
            }

            const userData = resultQuery.rows[0];
            const retorno = {
                errors: [],
                msg: ["Perfil do usuário"],
                data: {
                    id: userData.id,
                    nome: userData.nome,
                    email: userData.email
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao visualizar perfil do usuário"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);


router.delete(
    "/deletar",
    async (req: Request, res: Response) => {
        const { id } = req.body as IDeletarUsuario;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IDeletarUsuario>(
                bdConn,
                "DELETE FROM usuario WHERE id = $1 RETURNING id, nome, email;",
                [id]
            );

            if (resultQuery.rows.length === 0) {
                throw new Error("Usuário não encontrado");
            }

            const retorno = {
                errors: [],
                msg: ["Usuário deletado com sucesso"],
                data: resultQuery.rows[0]
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao excluir usuário"],
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