import express, { Request, Response } from "express";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { ICadastrarAlerta, IListarAlerta } from "../types/Alerta";

const router = express.Router();

/**
 * @swagger
 * /alerta/cadastrar:
 *   post:
 *     tags: [Alerta]
 *     summary: Cadastra um novo alerta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_estacao:
 *                 type: number
 *               id_parametro:
 *                 type: number
 *               condicao:
 *                 type: string
 *               nome:
 *                 type: string
 *               valor:
 *                 type: number
 *     responses:
 *       200:
 *         description: Alerta cadastrado com sucesso
 *       500:
 *         description: Falha ao cadastrar alerta
 */
router.post(
    "/cadastrar",
    async function (req: Request, res: Response) {
        const {
            id_estacao,
            id_parametro,
            condicao,
            nome,
            valor
        } = req.body as ICadastrarAlerta;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<ICadastrarAlerta>(
                bdConn,
                "insert into alerta (id_estacao, id_parametro, condicao, nome, valor) values ($1, $2, $3, $4, $5) returning id;",
                [id_estacao, id_parametro, condicao, nome, valor]
            );

            const retorno = {
                errors: [],
                msg: ["Alerta cadastrado com sucesso"],
                data: resultQuery.rows[0]
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao cadastrar alerta"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        };
        if (bdConn) EndConnection(bdConn);
    }
);
/**
 * @swagger
 * /alerta/{alertaId}:
 *   get:
 *     tags: [Alerta]
 *     summary: Obtém um alerta pelo ID
 *     parameters:
 *       - name: alertaId
 *         in: path
 *         required: true
 *         description: ID do alerta a ser obtido
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alerta listado com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Alerta não encontrado
 *       500:
 *         description: Falha ao listar alerta
 */
router.get(
    "/:alertaId",
    async function (req: Request, res: Response) {
        const id: number = parseInt(req.params.alertaId);

        if (id == undefined || id == 0) {
            const retorno = {
                errors: [],
                msg: [`o id (${id}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        };

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IListarAlerta>(
                bdConn,
                `select * from alerta where id = ${id};`,
                []
            );

            if (!resultQuery.rows.length) {
                const retorno = {
                    errors: [`Alerta com o id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                if (bdConn) EndConnection(bdConn);
                return;
            };

            const alerta = resultQuery.rows[0];

            const retorno = {
                errors: [],
                msg: ["Alerta listado com sucesso"],
                data: {
                    rows: [alerta],
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar alerta"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);
/**
 * @swagger
 * /alerta/{quantidade}/{pagina}:
 *   get:
 *     tags: [Alerta]
 *     summary: Lista alertas com paginação
 *     parameters:
 *       - name: quantidade
 *         in: path
 *         required: true
 *         description: Número de alertas a serem retornados
 *         schema:
 *           type: integer
 *       - name: pagina
 *         in: path
 *         required: true
 *         description: Número da página
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alertas listados com sucesso
 *       500:
 *         description: Falha ao listar alertas
 */
router.get(
    "/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IListarAlerta>(
                bdConn,
                "select * from alerta limit $1 offset $2;",
                [quantidade, pagina]
            );

            const alertas = resultQuery.rows;

            const retorno = {
                errors: [],
                msg: ["Alertas listados com sucesso"],
                data: {
                    rows: alertas,
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar estações"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

export {
    router as AlertaRouter
};