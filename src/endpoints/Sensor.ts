import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { IAtualizarSensor, ICadastrarSensor, IDeletarSensor, IListarSensor } from "../types/Sensor";
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

/**
 * @swagger
 * /sensor/{sensorId}:
 *   get:
 *     tags: [Sensor]
 *     summary: Obtém um sensor pelo ID
 *     parameters:
 *       - name: sensorId
 *         in: path
 *         required: true
 *         description: ID do sensor a ser obtido
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sensor listado com sucesso
 *       400:
 *         description: Id inválido 
 *       404:
 *         description: Sensor não encontrado
 *       500:
 *         description: Falha ao listar sensor
 */
router.get(
    "/:sensorId",
    async function (req: Request, res: Response) {
        const id: number = parseInt(req.params.sensorId);

        if (id == undefined || id == 0) {
            const retorno = {
                errors: [],
                msg: [`O id (${id}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        }

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IListarSensor>(
                bdConn,
                `select * from sensor where id = ${id};`,
                []
            );

            if (!resultQuery.rows.length) {
                const retorno = {
                    errors: [`Sensor com id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                if (bdConn) EndConnection(bdConn);
                return;
            }

            const retorno = {
                errors: [],
                msg: ["Sensor listado com sucesso"],
                data: {
                    rows: resultQuery.rows,
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar sensor"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /sensor/{quantidade}/{pagina}:
 *   get:
 *     tags: [Sensor]
 *     summary: Lista sensor com paginação
 *     parameters:
 *       - name: quantidade
 *         in: path
 *         required: true
 *         description: Número de sensores a serem retornados
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
 *         description: Sensores listados com sucesso
 *       500:
 *         description: Falha ao listar sensores
 */
router.get(
    "/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IListarSensor>(
                bdConn,
                "select * from sensor limit $1 offset $2;",
                [quantidade, pagina]
            );

            const retorno = {
                errors: [],
                msg: ["Sensores listados com sucesso"],
                data: {
                    rows: resultQuery.rows,
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar sensores"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /sensor/atualizar:
 *   patch:
 *     tags: [Sensor]
 *     summary: Atualiza um sensor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               id_parametro:
 *                 type: integer
 *               nome:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sensor atualizado com sucesso
 *       400:
 *         description: ID inválido
 *       500:
 *         description: Falha ao atualizar sensor
 */
router.patch(
    "/atualizar",
    async function (req: Request, res: Response) {
        const {
            id,
            nome,
            id_parametro
        } = req.body as IAtualizarSensor;

        if (id == undefined || id == 0) {
            const retorno = {
                errors: [],
                msg: [`O id (${id}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(404).send(retorno);
            return;
        }

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            let valoresQuery: Array<string> = [];
            if (nome != undefined) valoresQuery.push(`nome = '${nome}'`);
            if (id_parametro != undefined) valoresQuery.push(`id_parametro = '${id_parametro}'`);

            const resultQuery = await Query<IAtualizarSensor>(
                bdConn,
                `update sensor set ${valoresQuery.join(", ")} where id = ${id};`,
                []
            );

            const retorno = {
                errors: [],
                msg: ["Sensor atualizada com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao atualizar sensor"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /sensor/deletar:
 *   delete:
 *     tags: [Sensor]
 *     summary: Deleta uma sensor
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
 *         description: Sensor deletado com sucesso
 *       500:
 *         description: Falha ao deletar sensor
 */
router.delete(
    "/deletar",
    async function (req: Request, res: Response) {
        const {
            id
        } = req.body as IDeletarSensor;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IDeletarSensor>(
                bdConn,
                `delete from sensor where id = ${id};`,
                []
            );

            const retorno = {
                errors: [],
                msg: ["Sensor deletado com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao deletar sensor"],
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