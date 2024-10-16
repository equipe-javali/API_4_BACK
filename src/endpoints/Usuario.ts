//usuario.ts

import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { ICadastrarUsuario, IDeletarUsuario, IAtualizarUsuario, IListarUsuario } from "../types/Usuario";
import { IResponsePadrao } from "../types/Response";
const { HashPassword } = require("../services/bcrypt");
import { authenticateUser, updateUser, authenticateJWT } from "../services/auth";


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
 *       400:
 *         description: Requisição inválida 
 *       500:
 *         description: Falha ao cadastrar usuário
 */
router.post(
    "/cadastrar", 
    async (req: Request, res: Response) => {
        const { nome, email, senha } = req.body as ICadastrarUsuario;

        if (!nome || !email || !senha) {
            const retorno: IResponsePadrao = {
                errors: ["Nome, email e senha são obrigatórios"],
                msg: ["Requisição inválida"],
                data: null
            };
            return res.status(400).send(retorno);
        }

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

            const retorno: IResponsePadrao = {
                errors: [],
                msg: ["Usuário cadastrado com sucesso"],
                data: resultQuery.rows[0]
            };
            res.status(200).send(retorno);
        } catch (err) {
            const retorno: IResponsePadrao = {
                errors: [err instanceof Error ? err.message : "Erro desconhecido"],
                msg: ["Falha ao cadastrar usuário"],
                data: null
            };
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /usuario/login:
 *   post:
 *     tags: [Usuario]
 *     summary: Realiza o login de um usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "joao.silva@example.com"
 *               senha:
 *                 type: string
 *                 example: "senha123"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
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
 *       401:
 *         description: Senha inválida
 *       404:
 *         description: Usuário não encontrado
 */
router.post(
    "/login",
    async (req: Request, res: Response) => {
        const { email, senha } = req.body;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const user = await authenticateUser(email, senha, bdConn);

            const retorno: IResponsePadrao = {
                errors: [],
                msg: ["Login bem-sucedido"],
                data: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    token: user.token // Include the token in the response
                }
            };
            res.status(200).send(retorno);
        } catch (err) {
            let statusCode = 500;
            let msg = "Falha ao fazer login";

            if (err instanceof Error) {
                if (err.message === "Usuário não encontrado") {
                    statusCode = 404;
                    msg = err.message;
                } else if (err.message === "Senha inválida") {
                    statusCode = 401;
                    msg = err.message;
                }
            }

            const retorno: IResponsePadrao = {
                errors: [err instanceof Error ? err.message : "Erro desconhecido"],
                msg: [msg],
                data: null
            };
            res.status(statusCode).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

// Aplicar o middleware de autenticação JWT para TODAS as rotas abaixo:
router.use(authenticateJWT);


/**
 * @swagger
 * /usuario/usuarios:
 *   get:
 *     tags: [Usuario]
 *     summary: Lista todos os usuários
 *     responses:
 *       200:
 *         description: Lista de usuários
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: "João Silva"
 *                       email:
 *                         type: string
 *                         example: "joao.silva@example.com"
 *       500:
 *         description: Falha ao listar usuários
 */
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


/**
 * @swagger
 * /usuario/{usuarioId}:
 *   get:
 *     tags: [Usuario]
 *     summary: Visualiza o perfil de um usuário pelo ID
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Perfil do usuário
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
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Falha ao visualizar perfil do usuário
 */
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

router.post(
    "/logout",
    async (req: Request, res: Response) => {
        // adicionar lógica para invalidar o token, se necessário
        // Por exemplo, adicionar o token a uma blacklist

        const retorno: IResponsePadrao = {
            errors: [],
            msg: ["Logout realizado com sucesso"],
            data: null
        };
        res.status(200).send(retorno);
    }
);

/**
 * @swagger
 * /usuario/atualizar:
 *   patch:
 *     tags: [Usuario]
 *     summary: Atualiza um usuário existente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: "ID do usuário (obrigatório)"
 *                 example: 1
 *               nome:
 *                 type: string
 *                 description: "Nome do usuário (opcional)"
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 description: "Email do usuário (opcional)"
 *                 example: "joao.silva@example.com"
 *               senha:
 *                 type: string
 *                 description: "Nova senha do usuário (opcional)"
 *                 example: "novaSenha123"
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
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
 *       400:
 *         description: Nenhum dado para atualizar
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Falha ao atualizar usuário
 */
router.patch(
    "/atualizar",
    async (req: Request, res: Response) => {
        const { id, nome, email, senha } = req.body as IAtualizarUsuario;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            // Atualizar o usuário com o novo nome, email e senha
            const updatedUser = await updateUser(id.toString(), bdConn, nome, email, senha);

            const retorno: IResponsePadrao = {
                errors: [],
                msg: ["Usuário atualizado com sucesso"],
                data: updatedUser
            };
            res.status(200).send(retorno);
        } catch (err) {
            let statusCode = 500;
            let msg = "Falha ao atualizar usuário";

            if (err instanceof Error) {
                if (err.message === "Nenhum dado para atualizar") {
                    statusCode = 400;
                    msg = err.message;
                } else if (err.message === "Usuário não encontrado") {
                    statusCode = 404;
                    msg = err.message;
                }
            }

            const retorno: IResponsePadrao = {
                errors: [err instanceof Error ? err.message : "Erro desconhecido"],
                msg: [msg],
                data: null
            };
            res.status(statusCode).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);


/**
 * @swagger
 * /usuario/deletar:
 *   delete:
 *     tags: [Usuario]
 *     summary: Deleta um usuário existente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Usuário deletado com sucesso
 *       400:
 *         description: ID inválido
 *       500:
 *         description: Falha ao excluir usuário
 *         
 */
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
                const retorno = {
                    errors: [],
                    msg: [`id (${id}) é inválido`],
                    data: null
                } as IResponsePadrao;
                res.status(400).send(retorno);
                return;
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