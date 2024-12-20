import express, { Request, Response } from "express";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, Query } from "../services/postgres";
import { IAtualizarAlerta, ICadastrarAlerta, IDeletarAlerta, IListarAlerta } from "../types/Alerta";
import { authenticateJWT } from "../services/auth";

const router = express.Router();

/**
 * @swagger
 * /alerta/{alertaId}:
 *   get:
 *     tags: [Alerta]
 *     summary: Obtém um alerta pelo ID
 *     parameters:
 *       - name: alertaId
 *         in: path
 *         required: true
 *         description: ID do alerta a ser obtido
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alerta listado com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Alerta não encontrado
 *       500:
 *         description: Falha ao listar alerta
 */
router.get(
    "/:alertaId",
    async function (req: Request, res: Response) {
        const id: number = parseInt(req.params.alertaId);

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

            const resultQuery = await Query<IListarAlerta>(
                bdConn,
                `select * from alerta where id = $1;`,
                [id]
            );

            if (!resultQuery.length) {
                const retorno = {
                    errors: [`Alerta com o id (${id}) não existe`],
                    msg: [],
                    data: null
                } as IResponsePadrao;
                res.status(404).send(retorno);
                
                return;
            };

            const alerta = resultQuery[0];

            const retorno = {
                errors: [],
                msg: ["Alerta listado com sucesso"],
                data: {
                    rows: [alerta]
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar alerta"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);

/**
 * @swagger
 * /alerta/{quantidade}/{pagina}:
 *   get:
 *     tags: [Alerta]
 *     summary: Lista alertas com paginação
 *     parameters:
 *       - name: quantidade
 *         in: path
 *         required: true
 *         description: Número de alertas a serem retornados
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
 *         description: Alertas listados com sucesso
 *       500:
 *         description: Falha ao listar alertas
 */
router.get(
    "/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade: number = parseInt(req.params.quantidade);
        const pagina: number = parseInt(req.params.pagina);

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            const resultQuery = await Query<IListarAlerta>(
                bdConn,
                "select * from alerta limit $1 offset $2;",
                [quantidade, pagina]
            );

            const alertas = resultQuery;

            const retorno = {
                errors: [],
                msg: ["Alertas listados com sucesso"],
                data: {
                    rows: alertas
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao listar alertas"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);

// Aplicar o middleware de autenticação JWT para TODAS as rotas abaixo:
router.use(authenticateJWT);



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
 *       401:
 *         description: Não autorizado - Token não fornecido ou inválido
 *       403:
 *         description: Proibido - Token inválido ou não autorizado
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
            bdConn = StartConnection();

            const resultQuery = await Query<ICadastrarAlerta>(
                bdConn,
                "insert into alerta (id_estacao, id_parametro, condicao, nome, valor) values ($1, $2, $3, $4, $5) returning id;",
                [id_estacao, id_parametro, condicao, nome, valor]
            );

            const retorno = {
                errors: [],
                msg: ["Alerta cadastrado com sucesso"],
                data: resultQuery[0]
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
        
    }
);

/**
* @swagger
 * /alerta/atualizar:
 *   patch:
 *     tags: [Alerta]
 *     summary: Atualiza um alerta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: intege
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
 *         description: Alerta atualizado com sucesso
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado - Token não fornecido ou inválido
 *       403:
 *         description: Proibido - Token inválido ou não autorizado
 *       500:
 *         description: Falha ao atualizar alerta
 */
router.patch(
    "/atualizar",
    async function (req: Request, res: Response) {
        const {
            id,
            id_estacao,
            id_parametro,
            condicao,
            nome,
            valor
        } = req.body as IAtualizarAlerta;

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
            bdConn = StartConnection();

            let valoresQuery: Array<string> = [];
            if (id_estacao !== undefined) valoresQuery.push(`id_estacao = '${id_estacao}'`);
            if (id_parametro !== undefined) valoresQuery.push(`id_parametro = '${id_parametro}'`);
            if (condicao !== undefined) valoresQuery.push(`condicao = '${condicao}'`);
            if (nome !== undefined) valoresQuery.push(`nome = '${nome}'`);
            if (valor !== undefined) valoresQuery.push(`valor = '${valor}'`);

            await Query<IAtualizarAlerta>(
                bdConn,
                `UPDATE alerta SET ${valoresQuery.join(", ")} WHERE id = $1;`,
                [id]
            );

            const retorno = {
                errors: [],
                msg: ["Alerta atualizado com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao atualizar alerta"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);
/**
 * @swagger
 * /alerta/deletar:
 *   delete:
 *     tags: [Alerta]
 *     summary: Deleta um alerta
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
 *         description: Alerta deletado com sucesso
 *       401:
 *         description: Não autorizado - Token não fornecido ou inválido
 *       403:
 *         description: Proibido - Token inválido ou não autorizado
 *       500:
 *         description: Falha ao deletar alerta
 */
router.delete(
    "/deletar",
    async function (req: Request, res: Response) {
        const {
            id
        } = req.body as IDeletarAlerta;

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();

            await Query<IDeletarAlerta>(
                bdConn,
                `delete from alerta where id = $1;`,
                [id]
            );

            const retorno = {
                errors: [],
                msg: ["Alerta deletada com sucesso"],
                data: null
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha ao deletar alerta"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        };
        
    }
);
export {
    router as AlertaRouter
};