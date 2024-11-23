import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "./postgres";
import { StartConnection as redisStartConnection } from "./redis";
import { IAlertaParametro, ICadastrarMedicao, IDadosEstacao } from "../types/RecepcaoDados";

// checa se a estação possui um sensor com o parametro
async function EstacaoPossuiSensorParametro(macEscacao: string, nomeParametro: string) {
    let retorno = false;

    let postgres: Pool | null = null;
    try {
        postgres = StartConnection();

        const resultQuery = await Query(
            postgres,
            `select * from estacao
                join sensorestacao on estacao.id = id_estacao
                join sensor on sensor.id = id_sensor
                join parametro on parametro.id = id_parametro
                where estacao.mac_address = $1 and parametro.nome_json = $2;`,
            [macEscacao, nomeParametro]
        );

        if (resultQuery.rows.length > 0) {
            retorno = true;
        }
    } catch (err) {
        console.log(`falha ao tratar dados: ${(err as Error).message}`);
    }
    if (postgres) EndConnection(postgres);

    return retorno;
}

async function TratarParametro(macEscacao: string, nomeParametro: string, valorMedido: number) {
    let valorTratado: number = valorMedido;

    let postgres: Pool | null = null;
    try {
        postgres = StartConnection();

        const resultQuery = await Query(
            postgres,
            `select fator, valor_offset from estacao
                join sensorestacao on estacao.id = id_estacao
                join sensor on sensor.id = id_sensor
                join parametro on parametro.id = id_parametro
                where estacao.mac_address = $1 and parametro.nome_json = $2;`,
            [macEscacao, nomeParametro]
        );

        if (resultQuery.rows.length > 0) {
            valorTratado *= parseFloat(resultQuery.rows[0].fator);
            valorTratado += parseFloat(resultQuery.rows[0].valor_offset);
        } else {
            console.log(`falha ao tratar dados: Parâmetro não encontrado`);
        }
    } catch (err) {
        console.log(`falha ao tratar dados: ${(err as Error).message}`);
    }
    if (postgres) EndConnection(postgres);

    return valorTratado;
}

async function RegistrarMedicao(medicao: ICadastrarMedicao) {
    let postgres: Pool | null = null;
    try {
        postgres = StartConnection();

        await Query(
            postgres,
            `insert into medicao (id_sensor, data_hora, valor_calculado)
                values ($1, $2, $3);`,
            [medicao.sensor.id, medicao.data_hora, medicao.valor_calculado]
        );
    } catch (err) {
        console.log(`falha ao tratar dados: ${(err as Error).message}`);
    }
    if (postgres) EndConnection(postgres);
}

async function GetSensorID(macEscacao: string, nomeParametro: string) {
    let id: number = -1;

    let postgres: Pool | null = null;
    try {
        postgres = StartConnection();

        const resultQuery = await Query(
            postgres,
            `select sensor.id from estacao
                join sensorestacao on estacao.id = id_estacao
                join sensor on sensor.id = id_sensor
                join parametro on parametro.id = id_parametro
                where estacao.mac_address = $1 and parametro.nome_json = $2;`,
            [macEscacao, nomeParametro]
        );

        if (resultQuery.rows.length > 0) {
            id = resultQuery.rows[0].id;
        } else {
            console.log(`falha ao tratar dados: Parâmetro não encontrado`);
        }
    } catch (err) {
        console.log(`falha ao tratar dados: ${(err as Error).message}`);
    }
    if (postgres) EndConnection(postgres);

    return id;
}

async function RegistrarOcorrenciaAlerta(macEstacao: string, alerta: IAlertaParametro, medicao: ICadastrarMedicao) {
    let postgres: Pool | null = null;
    try {
        postgres = StartConnection();

        await Query(
            postgres,
            `insert into ocorrencia (id_alerta, data_hora, valor)
                values ($1, $2, $3);`,
            [alerta.id, medicao.data_hora, medicao.valor_calculado]
        );
    } catch (err) {
        console.log(`falha ao registrar ocorrência: ${(err as Error).message}`);
    }
    if (postgres) EndConnection(postgres);
}

async function ListagemAlertas(macEstacao: string) {
    let alertas: Array<IAlertaParametro> = [];

    let postgres: Pool | null = null;
    try {
        postgres = StartConnection();

        const resultQuery = await Query<IAlertaParametro>(
            postgres,
            `select alerta.id, parametro.nome_json, alerta.condicao, alerta.nome, alerta.valor from alerta
                join estacao on alerta.id_estacao = estacao.id
                join parametro on alerta.id_parametro = parametro.id
                where estacao.mac_address = $1;`,
            [macEstacao]
        );

        if (resultQuery.rows.length > 0) {
            alertas = resultQuery.rows;
        }
    } catch (err) {
        console.log(`falha ao registrar ocorrência: ${(err as Error).message}`);
    }
    if (postgres) EndConnection(postgres);

    return alertas;
}

function ChecaAlerta(alerta: IAlertaParametro, valor: number) {
    switch (alerta.condicao) {
        case "<":
            if (valor < alerta.valor)
                return true;
            break;
        case ">":
            if (valor > alerta.valor)
                return true;
            break;
        case "<=":
            if (valor <= alerta.valor)
                return true;
            break;
        case ">=":
            if (valor <= alerta.valor)
                return true;
            break;
        case "=":
            if (valor == alerta.valor)
                return true;
            break;
    }
    return false;
}

async function TratarDados() {
    const redis = await redisStartConnection();
    if (!redis) return
    const chaves = await redis.keys("*");

    for (const chave of chaves) {
        const conteudoChave = await redis.get(chave);
        if (conteudoChave == null) continue;

        const dadosMedicao: IDadosEstacao = JSON.parse(conteudoChave);
        const alertas: Array<IAlertaParametro> = await ListagemAlertas(dadosMedicao.uid);

        const parametrosMedicao = Object.getOwnPropertyNames(dadosMedicao).filter((n) => n != "uid" && n != "uxt");
        for (const nomeParametro of parametrosMedicao) {
            if (!(await EstacaoPossuiSensorParametro(dadosMedicao.uid, nomeParametro))) continue;

            const valorMedicao = parseFloat(dadosMedicao[nomeParametro]);
            const valorTratado = await TratarParametro(dadosMedicao.uid, nomeParametro, valorMedicao);

            const timezoneOffset = -3 * 60 * 60 * 1000;
            const dataCorrigida = new Date(Math.floor(parseFloat(dadosMedicao.uxt)) * 1000 + timezoneOffset).toISOString();
            const medicao: ICadastrarMedicao = {
                sensor: {
                    id: await GetSensorID(dadosMedicao.uid, nomeParametro)
                },
                data_hora: dataCorrigida,
                valor_calculado: valorTratado
            } as ICadastrarMedicao;
            await RegistrarMedicao(medicao);

            for (const alerta of alertas) {
                if (alerta.nome_json !== nomeParametro) continue;

                if (ChecaAlerta(alerta, valorTratado)) {
                    await RegistrarOcorrenciaAlerta(dadosMedicao.uid, alerta, medicao);
                };
            };
        };

        await redis.del(chave);
    }
    if (redis) await redis.quit();
}

export {
    TratarDados
}