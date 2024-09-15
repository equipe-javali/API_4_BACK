import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Pool } from "pg";
import { IAtualizarEstacao, ICadastrarEstacao, IDeletarEstacao, IListarEstacao } from "../types/Estacao";
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
        } = req.body as ICadastrarEstacao;

        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();

            const resultQuery = await Query<ICadastrarEstacao>(
                bdConn,
                "insert into estacao (nome, endereco, latitude, longitude, mac_address) values ($1, $2, $3, $4, $5);",
                [nome, endereco, latitude, longitude, mac_address]
            );

            const retorno = {
                errors: [],
                msg: ["estação cadastrada com sucesso"],
                data: null
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
            res.status(404).send(retorno);
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

export {
    router as EstacaoRouter
};