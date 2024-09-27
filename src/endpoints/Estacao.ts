import express, { Request, Response } from "express";
import { IAtualizarEstacao, ICadastrarEstacao, IDeletarEstacao, IListarEstacao } from "../types/Estacao";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";

const router = express.Router();

/**
 * @swagger
 * /estacao/cadastrar:
 *   post:
 *     tags: [Estacao]
 *     summary: Cadastra uma nova estação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               endereco:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               mac_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estação cadastrada com sucesso
 *       500:
 *         description: Falha ao cadastrar estação
 */
router.post(
    "/cadastrar",
    async function (req: Request, res: Response) {
        const {
            nome,
            endereco,
            latitude,
            longitude,
            mac_address
        } = req.body as ICadastrarEstacao;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<ICadastrarEstacao>(
                bdConn,
                "insert into estacao (nome, endereco, latitude, longitude, mac_address) values ($1, $2, $3, $4, $5) returning id;",
                [nome, endereco, latitude, longitude, mac_address]
            );

            const retorno = {
                errors: [],
                msg: ["estação cadastrada com sucesso"],
                data: resultQuery.rows[0]
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao cadastrar estação"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /estacao/{estacaoId}:
 *   get:
 *     tags: [Estacao]
 *     summary: Obtém uma estação pelo ID
 *     parameters:
 *       - name: estacaoId
 *         in: path
 *         required: true
 *         description: ID da estação a ser obtida
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estação listada com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Estação não encontrada
 *       500:
 *         description: Falha ao listar estação
 */
router.get(
    "/:estacaoId",
    async function (req: Request, res: Response) {
        const id: number = parseInt(req.params.estacaoId);

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

            const resultQuery = await Query<IListarEstacao>(
                bdConn,
                `select * from estacao where id = ${id};`,
                []
            );

            if (!resultQuery.rows.length) {
                const retorno = {
                    errors: [`estação com id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                if (bdConn) EndConnection(bdConn);
                return;
            }

            const retorno = {
                errors: [],
                msg: ["estação listada com sucesso"],
                data: {
                    rows: resultQuery.rows,
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao listar estação"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /estacao/{quantidade}/{pagina}:
 *   get:
 *     tags: [Estacao]
 *     summary: Lista estações com paginação
 *     parameters:
 *       - name: quantidade
 *         in: path
 *         required: true
 *         description: Número de estações a serem retornadas
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
 *         description: Estações listadas com sucesso
 *       500:
 *         description: Falha ao listar estações
 */
router.get(
    "/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IListarEstacao>(
                bdConn,
                "select * from estacao limit $1 offset $2;",
                [quantidade, pagina]
            );

            const retorno = {
                errors: [],
                msg: ["estações listadas com sucesso"],
                data: {
                    rows: resultQuery.rows,
                    fields: resultQuery.fields
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao listar estações"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /estacao/atualizar:
 *   patch:
 *     tags: [Estacao]
 *     summary: Atualiza uma estação
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
 *               endereco:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               mac_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estação atualizada com sucesso
 *       400:
 *         description: ID inválido
 *       500:
 *         description: Falha ao atualizar estação
 */
router.patch(
    "/atualizar",
    async function (req: Request, res: Response) {
        const {
            id,
            nome,
            endereco,
            latitude,
            longitude,
            mac_address
        } = req.body as IAtualizarEstacao;

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

            let valoresQuery: Array<string> = [];
            if (nome != undefined) valoresQuery.push(`nome = '${nome}'`);
            if (endereco != undefined) valoresQuery.push(`endereco = '${endereco}'`);
            if (latitude != undefined) valoresQuery.push(`latitude = '${latitude}'`);
            if (longitude != undefined) valoresQuery.push(`longitude = '${longitude}'`);
            if (mac_address != undefined) valoresQuery.push(`mac_address = '${mac_address}'`);

            const resultQuery = await Query<IAtualizarEstacao>(
                bdConn,
                `update estacao set ${valoresQuery.join(", ")} where id = ${id};`,
                []
            );

            const retorno = {
                errors: [],
                msg: ["estação atualizada com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao atualizar estação"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /estacao/deletar:
 *   delete:
 *     tags: [Estacao]
 *     summary: Deleta uma estação
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
 *         description: Estação deletada com sucesso
 *       500:
 *         description: Falha ao deletar estação
 */
router.delete(
    "/deletar",
    async function (req: Request, res: Response) {
        const {
            id
        } = req.body as IDeletarEstacao;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<IDeletarEstacao>(
                bdConn,
                `delete from estacao where id = ${id};`,
                []
            );

            const retorno = {
                errors: [],
                msg: ["estação deletada com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao deletar estação"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /estacao/adicionarSensor:
 *   post:
 *     tags: [Estacao]
 *     summary: Adiciona um sensor a uma estação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_estacao:
 *                 type: number
 *               id_sensor:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sensor adicionado à estação com sucesso
 *       500:
 *         description: Falha ao adicionar sensor à estação
 */
router.post(
    "/adicionarSensor",
    async function (req: Request, res: Response) {
        const {
            id_estacao,
            id_sensor
        } = req.body;

        if (id_estacao == undefined || id_estacao == 0) {
            const retorno = {
                errors: [],
                msg: [`o id_estacao (${id_estacao}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        }

        if (id_sensor == undefined || id_sensor == 0) {
            const retorno = {
                errors: [],
                msg: [`o id_sensor (${id_sensor}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        }

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query(
                bdConn,
                "insert into sensorestacao (id_estacao, id_sensor) values ($1, $2);",
                [id_estacao, id_sensor]
            );

            const retorno = {
                errors: [],
                msg: ["sensor adicionado à estação com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao adicionar sensor à estação"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

/**
 * @swagger
 * /estacao/removerSensor:
 *   post:
 *     tags: [Estacao]
 *     summary: Remove um sensor a uma estação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_estacao:
 *                 type: number
 *               id_sensor:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sensor removido da estação com sucesso
 *       500:
 *         description: Falha ao remover sensor da estação
 */
router.post(
    "/removerSensor",
    async function (req: Request, res: Response) {
        const {
            id_estacao,
            id_sensor
        } = req.body;

        if (id_estacao == undefined || id_estacao == 0) {
            const retorno = {
                errors: [],
                msg: [`o id_estacao (${id_estacao}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        }

        if (id_sensor == undefined || id_sensor == 0) {
            const retorno = {
                errors: [],
                msg: [`o id_sensor (${id_sensor}) é inválido`],
                data: null
            } as IResponsePadrao;
            res.status(400).send(retorno);
            return;
        }

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query(
                bdConn,
                "delete from sensorestacao where id_estacao = $1 and id_sensor = $2;",
                [id_estacao, id_sensor]
            );

            const retorno = {
                errors: [],
                msg: ["sensor removido da estação com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["falha ao remover sensor da estação"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);

export {
    router as EstacaoRouter
};