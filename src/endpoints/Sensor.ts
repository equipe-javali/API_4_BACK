import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { ICadastrarSensor } from "../types/Sensor";
import { IResponsePadrao } from "../types/Response";

const router = express.Router();

/**
 * @swagger
 * /sensor/cadastrar:
 *   post:
 *     tags: [Sensor]
 *     summary: Cadastra um novo Sensor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               id_parametro:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sensor cadastrado com sucesso
 *       500:
 *         description: Falha ao cadastrar sensor
 */
router.post(
    "/cadastrar",
    async function (req: Request, res: Response) {
        const {
            nome,
            id_parametro
        } = req.body as ICadastrarSensor;

        console.log(id_parametro)
        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<ICadastrarSensor>(
                bdConn,
                "insert into sensor (nome, id_parametro) values ($1, $2);",
                [nome, id_parametro]
            );

            const retorno = {
                errors: [],
                msg: ["Sensor cadastrado com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao cadastrar sensor"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

export {
    router as SensorRouter
};