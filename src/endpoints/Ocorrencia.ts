import express, { Request, Response } from "express";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { IListarOcorrencia } from "../types/Ocorrencia";

const router = express.Router();

/**
 * @swagger
 * /ocorrencia/{ocorrenciaId}:
 *   get:
 *     tags: [Ocorrencia]
 *     summary: Obtém uma ocorrência pelo ID
 *     parameters:
 *       - name: ocorrenciaId
 *         in: path
 *         required: true
 *         description: ID da ocorrência a ser obtido
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ocorrência listada com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Ocorrência não encontrada
 *       500:
 *         description: Falha ao listar ocorrência
 */
router.get(
    "/:ocorrenciaId",
    async function (req: Request, res: Response) {
        const id: number = parseInt(req.params.ocorrenciaId);
        console.log(id);

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

            const resultQuery = await Query<IListarOcorrencia>(
                bdConn,
                `select * from ocorrencia where id = ${id};`,
                []
            );

            if (!resultQuery.rows.length) {
                const retorno = {
                    errors: [`Ocorrência com o id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                if (bdConn) EndConnection(bdConn);
                return;
            };

            const ocorrencia = resultQuery.rows[0];

            const retorno = {
                errors: [],
                msg: ["Ocorrência listada com sucesso"],
                data: {
                    rows: [ocorrencia],
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar ocorrência"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

export {
    router as OcorrenciaRouter
};