//usuario.ts

import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { ICadastrarUsuario, IDeletarUsuario, IAtualizarUsuario, IListarUsuario } from "../types/Usuario";
import { IResponsePadrao } from "../types/Response";
const { HashPassword } = require("../services/bcrypt");
import { authenticateUser, updateUser } from "../services/auth";


const router = express.Router();


/**
 * @swagger
 * /usuario/cadastrar:
 *   post:
 *     tags: [Usuario]
 *     summary: Cadastra um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 example: "joao.silva@example.com"
 *               senha:
 *                 type: string
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Usuário cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 msg:
 *                   type: array
 *                   items:
 *                     type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: "João Silva"
 *                     email:
 *                       type: string
 *                       example: "joao.silva@example.com"
 *                     senha:
 *                       type: string
 *                       example: "$2b$10$niheCTutS6DzYR1yTC8Yq.N4G.XUj5nEGyC2F3v18r6b/uHWJTSw6"
 *       500:
 *         description: Falha ao cadastrar usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 msg:
 *                   type: array
 *                   items:
 *                     type: string
 *                 data:
 *                   type: null
 */
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

            const resultQuery = await Query<IListarUsuario>(
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

            const resultQuery = await Query<IListarUsuario>(
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
                data: userData
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

router.patch(
    "/atualizar",
    async (req: Request, res: Response) => {
        const { id, nome, email, senha } = req.body as IAtualizarUsuario;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            // Atualizar o usuário com o novo nome, email e senha
            const updatedUser = await updateUser(id.toString(), bdConn, nome, email, senha);

            const retorno = {
                errors: [],
                msg: ["Usuário atualizado com sucesso"],
                data: updatedUser
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao atualizar usuário"],
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
                data: null
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