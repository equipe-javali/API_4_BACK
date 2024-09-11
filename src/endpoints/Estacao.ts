import express, { Request, Response } from "express";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { Client } from "ts-postgres";

const router = express.Router();

interface ICadastroEstacao {
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
};

interface IAtualizacaoEstacao {
    _: any
};

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

        let client: Client | null = null;
        try {
            client = await StartConnection();

            const resultado = await Query<ICadastroEstacao>(
                client,
                "query",
                ["valor 1", "valor 2", 123]
            );

            // 
            for (let res in resultado) {

            }

            if (client) EndConnection(client);
        } catch (err) {
            if (client) EndConnection(client);
            res.status(500).send(err);
        }
    }
);

router.get(
    "/:estacaoId",
    async function (req: Request, res: Response) {
        const id = req.params.estacaoId;

        let client: Client | null = null;
        try {
            client = await StartConnection();

            const resultado = await Query<ICadastroEstacao>(
                client,
                "query",
                ["valor 1", "valor 2", 123]
            );

            // 
            for (let res in resultado) {

            }

            if (client) EndConnection(client);
        } catch (err) {
            if (client) EndConnection(client);
            res.status(500).send(err);
        }
    }
);

router.get(
    "/:quantidade/:pagina",
    async function (req: Request, res: Response) {
        const quantidade = req.params.quantidade;
        const pagina = req.params.pagina;
        // retorna todas as estações, com paginação

        let client: Client | null = null;
        try {
            client = await StartConnection();

            const resultado = await Query<ICadastroEstacao>(
                client,
                "query",
                ["valor 1", "valor 2", 123]
            );

            // 
            for (let res in resultado) {

            }

            if (client) EndConnection(client);
        } catch (err) {
            if (client) EndConnection(client);
            res.status(500).send(err);
        }
    }
);

router.put(
    "/atualizar",
    async function (req: Request, res: Response) {
        const {
            _
        } = req.body as IAtualizacaoEstacao;

        let client: Client | null = null;
        try {
            client = await StartConnection();

            const resultado = await Query<ICadastroEstacao>(
                client,
                "query",
                ["valor 1", "valor 2", 123]
            );

            // 
            for (let res in resultado) {

            }

            if (client) EndConnection(client);
        } catch (err) {
            if (client) EndConnection(client);
            res.status(500).send(err);
        }
    }
);

router.delete(
    "/deletar",
    async function (req: Request, res: Response) {
        const {
            _
        } = req.body;

        let client: Client | null = null;
        try {
            client = await StartConnection();

            const resultado = await Query<ICadastroEstacao>(
                client,
                "query",
                ["valor 1", "valor 2", 123]
            );

            // 
            for (let res in resultado) {

            }

            if (client) EndConnection(client);
        } catch (err) {
            if (client) EndConnection(client);
            res.status(500).send(err);
        }
    }
);

export {
    router as EstacaoRouter
};