import express, { Request, Response } from "express";
import { IListarParametro } from "../types/Parametro";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";

const router = express.Router();

/**
 * @swagger
 * /unidademedida/{unidadeId}:
 *   get:
 *     tags: [UnidadeMedida]
 *     summary: Obtém uma unidade de medida pelo ID
 *     parameters:
 *       - in: path
 *         name: unidadeId
 *         required: true
 *         description: ID da unidade de medida a ser obtida
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Unidade de medida encontrada com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Unidade de medida não encontrada
 */
router.get(
    "/:unidadeId",
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
            bdConn = await StartConnection();

            const resultQuery = await Query<IListarParametro>(
                bdConn,
                `select * from unidade_medida where id = ${id};`,
                []
            );

            if (!resultQuery.rows.length) {
                const retorno = {
                    errors: [`unidade de medida com id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                if (bdConn) EndConnection(bdConn);
                return;
            }

            const retorno = {
                errors: [],
                msg: ["unidade de medida listada com sucesso"],
                data: {
                    rows: resultQuery.rows,
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao listar unidade de medida"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);
/**
 * @swagger
 * /unidademedida:
 *   get:
 *     tags: [UnidadeMedida]
 *     summary: Lista todas as unidades de medida
 *     responses:
 *       200:
 *         description: Unidades de medida listadas com sucesso
 *       500:
 *         description: Falha ao listar unidades de medida
 */
router.get(
    "/",
    async function (req: Request, res: Response) {
        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IListarParametro>(
                bdConn,
                "select * from unidade_medida;",
                []
            );

            const retorno = {
                errors: [],
                msg: ["unidades de medida listadas com sucesso"],
                data: {
                    rows: resultQuery.rows,
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao listar unidades de medida"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

export {
    router as UnidadeMedidaRouter
};