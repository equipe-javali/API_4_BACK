import express, { Request, Response } from "express";
import { IDadosEstacao } from "../types/RecepcaoDados";
import { IResponsePadrao } from "../types/Response";
import { StartConnection } from "../services/redis";

const router = express.Router();

/**
 * @swagger
 * recepcaoDados/registrar:
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
 *               uid:
 *                 type: string
 *                 description: "ID único da estação"
 *               uxt:
 *                 type: string
 *                 description: "Identificador do tipo de dado (uxt)"
 *               ...:
 *                 type: any
 *                 description: "valor"
 *             required:
 *               - uid
 *               - uxt
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

        let redisClient = null;
        try {
            redisClient = await StartConnection();
            redisClient.set(`${dadosEstacao.uid}:${dadosEstacao.uxt}`, JSON.stringify(dadosEstacao));

            const retorno = {
                errors: [],
                msg: ["Dados registrados com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao registrar dados da estação"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (redisClient) await redisClient.quit();
    }
);

export {
    router as RecepcaoDadosRouter
};