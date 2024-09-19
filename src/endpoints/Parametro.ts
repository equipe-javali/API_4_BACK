import express, { Request, Response } from "express";
import { ICadastrarParametro } from "../types/Parametro";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";

const router = express.Router();

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
            offset
        } = req.body as ICadastrarParametro;

        console.log(unidade_medida,
            nome,
            fator,
            offset);

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<ICadastrarParametro>(
                bdConn,
                "insert into tipo_parametro (id_unidade, nome, fator, valor_offset, nome_json) values ($1, $2, $3, $4, $5);",
                [unidade_medida.id, nome, fator, offset, ""]
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
        if (bdConn) EndConnection(bdConn);
    }
);


export {
    router as ParametroRouter
};