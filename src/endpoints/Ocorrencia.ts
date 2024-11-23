import express, { Request, Response } from "express";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { IListarOcorrencia } from "../types/Ocorrencia";

const router = express.Router();

/**
 * @swagger
 * /ocorrencia/ultimasOcorrencias/{quantidade}/{pagina}:
 *   get:
 *     tags: [Ocorrencia]
 *     summary: Obtém as últimas ocorrências paginadas
 *     parameters:
 *       - name: quantidade
 *         in: path
 *         required: true
 *         description: Número de ocorrências a serem retornadas
 *         schema:
 *           type: integer
 *       - name: pagina
 *         in: path
 *         required: true
 *         description: Número da página a ser retornada (0 para a primeira página)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ocorrências listadas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         description: Não foram encontradas ocorrências
 *       500:
 *         description: Falha ao listar as ocorrências
 */
router.get(
    "/ultimasOcorrencias/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            const resultQuery = await Query<IListarOcorrencia>(
                bdConn,
                `select min(o.id) as id, o.id_alerta, max(o.data_hora) as data_hora, max(o.valor) as valor, um.nome as nome_unidade
                    from ocorrencia o
                        join alerta on o.id_alerta = alerta.id
                        join parametro on parametro.id = alerta.id_parametro
                        join unidade_medida um on um.id = parametro.id_unidade
                    group by o.id_alerta, um.nome
                    order by data_hora desc limit $1 offset $2;`,
                [quantidade, pagina]
            );

            const ocorrencias = resultQuery;

            const retorno = {
                errors: [],
                msg: ["Ocorrências recentes listadas com sucesso"],
                data: {
                    rows: [ocorrencias]
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar as ocorrências recentes"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);
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
            bdConn = StartConnection();

            const resultQuery = await Query<IListarOcorrencia>(
                bdConn,
                `select * from ocorrencia where id = $1;`,
                [id]
            );

            if (!resultQuery.length) {
                const retorno = {
                    errors: [`Ocorrência com o id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                if (bdConn) EndConnection(bdConn);
                return;
            };

            const ocorrencia = resultQuery[0];

            const retorno = {
                errors: [],
                msg: ["Ocorrência listada com sucesso"],
                data: {
                    rows: [ocorrencia]
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
/**
 * @swagger
 * /ocorrencia/{idAlerta}/{quantidade}/{pagina}:
 *   get:
 *     tags: [Ocorrencia]
 *     summary: Lista ocorrências de um alerta com paginação
 *     parameters:
 *       - name: idAlerta
 *         in: path
 *         required: true
 *         description: ID do alerta a ser obtido
 *         schema:
 *           type: integer
 *       - name: quantidade
 *         in: path
 *         required: true
 *         description: Número de ocorrência a serem retornados
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
 *         description: Ocorrência listadas com sucesso
 *       500:
 *         description: Falha ao listar ocorrência
 */
router.get(
    "/:idAlerta/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const idAlerta: number = parseInt(req.params.idAlerta);
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            const resultQuery = await Query<IListarOcorrencia>(
                bdConn,
                "select * from ocorrencia where id_alerta = $1 limit $2 offset $3;",
                [idAlerta, quantidade, pagina]
            );

            const ocorrência = resultQuery;

            const retorno = {
                errors: [],
                msg: ["Ocorrências listadas com sucesso"],
                data: {
                    rows: ocorrência
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar ocorrências"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        if (bdConn) EndConnection(bdConn);
    }
);
/**
 * @swagger
 * /ocorrencia/{quantidade}/{pagina}:
 *   get:
 *     tags: [Ocorrencia]
 *     summary: Lista ocorrências com paginação
 *     parameters:
 *       - name: quantidade
 *         in: path
 *         required: true
 *         description: Número de ocorrência a serem retornados
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
 *         description: Ocorrência listadas com sucesso
 *       500:
 *         description: Falha ao listar ocorrência
 */
router.get(
    "/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            const resultQuery = await Query<IListarOcorrencia>(
                bdConn,
                "select * from ocorrencia limit $1 offset $2;",
                [quantidade, pagina]
            );

            const ocorrência = resultQuery;

            const retorno = {
                errors: [],
                msg: ["Ocorrência listadas com sucesso"],
                data: {
                    rows: ocorrência
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