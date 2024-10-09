import express, { Request, Response } from "express";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { ICadastrarAlerta } from "../types/Alerta";

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

export {
    router as AlertaRouter
};