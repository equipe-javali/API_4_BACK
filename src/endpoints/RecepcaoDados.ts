import express, { Request, Response } from "express";
import { IDadosEstacao } from "../types/RecepcaoDados";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";

const router = express.Router();

/**
 * @swagger
 * /recepcaoDados/registrar:
 *   post:
 *     tags: [RecepcaoDados]
 *     summary: Guarda os dados recebidos da estação sem tratamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *     responses:
 *       200:
 *         description: Dados registrados com sucesso
 *       500:
 *         description: Falha ao registrar dados da estação
 */
router.post(
    "/registrar",
    async function (req: Request, res: Response) {
        const dadosEstacao = req.body as IDadosEstacao;

        // armazenar os dados no redis

        // let bdConn: Pool | null = null;
        // try {
        //     bdConn = await StartConnection();

        //     const resultQuery = await Query<IDadosEstacao>(
        //         bdConn,
        //         "insert into parametro (id_unidade, nome, fator, valor_offset, nome_json) values ($1, $2, $3, $4, $5);",
        //         [unidade_medida.id, nome, fator, offset, ""]
        //     );

        //     const retorno = {
        //         errors: [],
        //         msg: ["parâmetro cadastrado com sucesso"],
        //         data: null
        //     } as IResponsePadrao;
        //     res.status(200).send(retorno);
        // } catch (err) {
        //     console.log(err);
        //     const retorno = {
        //         errors: [(err as Error).message],
        //         msg: ["falha ao cadastrar parâmetro"],
        //         data: null
        //     } as IResponsePadrao;
        //     res.status(500).send(retorno);
        // }
        // if (bdConn) EndConnection(bdConn);
    }
);

export {
    router as RecepcaoDadosRouter
};