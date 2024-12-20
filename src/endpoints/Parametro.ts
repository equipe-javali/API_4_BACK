import express, { Request, Response } from "express";
import { IAtualizarParametro, ICadastrarParametro, IDeletarParametro, IListarParametro } from "../types/Parametro";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, Query } from "../services/postgres";
import { authenticateJWT } from "../services/auth";

const router = express.Router();

/**
 * @swagger
 * /parametro/{parametroId}:
 *   get:
 *     tags: [Parametro]
 *     summary: Obtém um parâmetro pelo ID
 *     parameters:
 *       - in: path
 *         name: parametroId
 *         required: true
 *         description: ID do parâmetro a ser obtido
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Parâmetro encontrado com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Parâmetro não encontrado
 */
router.get(
    "/:parametroId",
    async function (req: Request, res: Response) {
        const id: number = parseInt(req.params.parametroId);

        if (id == undefined || id == 0) {
            const retorno = {
                errors: [],
                msg: [`o id (${id}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        }

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            const resultQuery = await Query<IListarParametro>(
                bdConn,
                `select * from parametro where id = $1;`,
                [id]
            );

            if (!resultQuery.length) {
                const retorno = {
                    errors: [`parâmetro com id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                
                return;
            }

            const retorno = {
                errors: [],
                msg: ["parâmetro listado com sucesso"],
                data: {
                    rows: resultQuery
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao listar parâmetro"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);

/**
 * @swagger
 * /parametro/{quantidade}/{pagina}:
 *   get:
 *     tags: [Parametro]
 *     summary: Lista parâmetros com paginacao
 *     parameters:
 *       - in: path
 *         name: quantidade
 *         required: true
 *         description: Número de parâmetros a serem retornados
 *         schema:
 *           type: integer
 *       - in: path
 *         name: pagina
 *         required: true
 *         description: Número da página a ser retornada
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Parâmetros listados com sucesso
 *       500:
 *         description: Falha ao listar parâmetros
 */
router.get(
    "/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            const resultQuery = await Query<IListarParametro>(
                bdConn,
                "select * from parametro limit $1 offset $2;",
                [quantidade, pagina]
            );

            const retorno = {
                errors: [],
                msg: ["parâmetros listados com sucesso"],
                data: {
                    rows: resultQuery
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao listar parâmetros"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);

// Aplicar o middleware de autenticação JWT para TODAS as rotas abaixo:
router.use(authenticateJWT);

/**
 * @swagger
 * /parametro/cadastrar:
 *   post:
 *     tags: [Parametro]
 *     summary: Cadastra um novo parâmetro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unidade_medida:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *               nome:
 *                 type: string
 *               fator:
 *                 type: number
 *               offset:
 *                 type: number
 *     responses:
 *       200:
 *         description: Parâmetro cadastrado com sucesso
 *       401:
 *         description: Não autorizado - Token não fornecido ou inválido
 *       403:
 *         description: Proibido - Token inválido ou não autorizado
 *       500:
 *         description: Falha ao cadastrar parâmetro
 */
router.post(
    "/cadastrar",
    async function (req: Request, res: Response) {
        const {
            unidade_medida,
            nome,
            fator,
            offset,
            nome_json
        } = req.body as ICadastrarParametro;

        console.log(unidade_medida,
            nome,
            fator,
            offset);

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            await Query<ICadastrarParametro>(
                bdConn,
                "insert into parametro (id_unidade, nome, fator, valor_offset, nome_json) values ($1, $2, $3, $4, $5);",
                [unidade_medida.id, nome, fator, offset, nome_json]
            );

            const retorno = {
                errors: [],
                msg: ["parâmetro cadastrado com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            console.log(err);
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao cadastrar parâmetro"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);

/**
 * @swagger
 * /parametro/atualizar:
 *   patch:
 *     tags: [Parametro]
 *     summary: Atualiza um parâmetro existente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               nome:
 *                 type: string
 *               fator:
 *                 type: number
 *               offset:
 *                 type: number
 *     responses:
 *       200:
 *         description: Parâmetro atualizado com sucesso
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado - Token não fornecido ou inválido
 *       403:
 *         description: Proibido - Token inválido ou não autorizado
 *       500:
 *         description: Falha ao atualizar parâmetro
 */
router.patch(
    "/atualizar",
    async function (req: Request, res: Response) {
        const {
            id,
            nome,
            fator,
            offset,
            nome_json
        } = req.body as IAtualizarParametro;

        if (id == undefined || id == 0) {
            const retorno = {
                errors: [],
                msg: [`o id (${id}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        }

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            let valoresQuery: Array<string> = [];
            if (nome != undefined) valoresQuery.push(`nome = '${nome}'`);
            if (fator != undefined) valoresQuery.push(`fator = '${fator}'`);
            if (offset != undefined) valoresQuery.push(`valor_offset = '${offset}'`);
            if (nome_json != undefined) valoresQuery.push(`nome_json = '${nome_json}'`);

            await Query<IAtualizarParametro>(
                bdConn,
                `update parametro set ${valoresQuery.join(", ")} where id = $1;`,
                [id]
            );

            const retorno = {
                errors: [],
                msg: ["parâmetro atualizado com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao atualizar parâmetro"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);
/**
 * @swagger
 * /parametro/deletar:
 *   delete:
 *     tags: [Parametro]
 *     summary: Deleta um parâmetro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Parâmetro deletado com sucesso
 *       401:
 *         description: Não autorizado - Token não fornecido ou inválido
 *       403:
 *         description: Proibido - Token inválido ou não autorizado
 *       500:
 *         description: Falha ao deletar parâmetro
 */
router.delete(
    "/deletar",
    async function (req: Request, res: Response) {
        const {
            id
        } = req.body as IDeletarParametro;

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            await Query<IDeletarParametro>(
                bdConn,
                `delete from parametro where id = $1;`,
                [id]
            );

            const retorno = {
                errors: [],
                msg: ["parâmetro deletado com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao deletar parâmetro"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);

export {
    router as ParametroRouter
};