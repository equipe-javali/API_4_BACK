import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { ICadastroEstacao } from "../types/Estacao";
import { IResponsePadrao } from "../types/Response";

const router = express.Router();

router.post(
    "/cadastrar",
    async function (req: Request, res: Response) {
        const {
            nome,
            endereco,
            latitude,
            longitude,
            mac_address
        } = req.body as ICadastroEstacao;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<ICadastroEstacao>(
                bdConn,
                "insert into estacao (nome, endereco, latitude, longitude, mac_address) values ($1, $2, $3, $4, $5);",
                [nome, endereco, latitude, longitude, mac_address]
            );

            const retorno = {
                errors: [],
                msg: ["estação cadastrada com sucesso"],
                data: {
                    rows: resultQuery.rows,
                    fields: resultQuery.fields
                }
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

// router.get(
//     "/:estacaoId",
//     async function (req: Request, res: Response) {
//         const id = req.params.estacaoId;

//         let bdConn: Pool | null = null;
//         try {
//             bdConn = await StartConnection();

//             const resultQuery = await Query<ICadastroEstacao>(
//                 bdConn,
//                 "query",
//                 ["valor 1", "valor 2", 123]
//             );

//             // 
//             for (let res in resultQuery) {

//             }

//             if (bdConn) EndConnection(bdConn);
//         } catch (err) {
//             if (bdConn) EndConnection(bdConn);
//             res.status(500).send(err);
//         }
//     }
// );

// router.get(
//     "/:quantidade/:pagina",
//     async function (req: Request, res: Response) {
//         const quantidade = req.params.quantidade;
//         const pagina = req.params.pagina;

//         let bdConn: Pool | null = null;
//         try {
//             bdConn = await StartConnection();

//             const resultQuery = await Query<ICadastroEstacao>(
//                 bdConn,
//                 "select * from estacao limit $1 offset $2;",
//                 [quantidade, pagina]
//             );

//             if (resultQuery.rows) res.status(200).send(resultQuery.rows);
//             else res.status(404).send(resultQuery.rows);

//             if (bdConn) EndConnection(bdConn);
//         } catch (err) {
//             res.status(500).send(err);
//             if (bdConn) EndConnection(bdConn);
//         }
//     }
// );

// router.put(
//     "/atualizar",
//     async function (req: Request, res: Response) {
//         const {
//             _
//         } = req.body as IAtualizacaoEstacao;

//         let bdConn: Pool | null = null;
//         try {
//             bdConn = await StartConnection();

//             const resultQuery = await Query<ICadastroEstacao>(
//                 bdConn,
//                 "query",
//                 ["valor 1", "valor 2", 123]
//             );

//             // 
//             for (let res in resultQuery) {

//             }

//             if (bdConn) EndConnection(bdConn);
//         } catch (err) {
//             if (bdConn) EndConnection(bdConn);
//             res.status(500).send(err);
//         }
//     }
// );

// router.delete(
//     "/deletar",
//     async function (req: Request, res: Response) {
//         const {
//             _
//         } = req.body;

//         let bdConn: Pool | null = null;
//         try {
//             bdConn = await StartConnection();

//             const resultQuery = await Query<ICadastroEstacao>(
//                 bdConn,
//                 "query",
//                 ["valor 1", "valor 2", 123]
//             );

//             // 
//             for (let res in resultQuery) {

//             }

//             if (bdConn) EndConnection(bdConn);
//         } catch (err) {
//             if (bdConn) EndConnection(bdConn);
//             res.status(500).send(err);
//         }
//     }
// );

export {
    router as EstacaoRouter
};