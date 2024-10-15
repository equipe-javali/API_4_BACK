import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "./postgres";
import { StartConnection as redisStartConnection } from "./redis";
import { ICadastrarMedicao, IDadosEstacao } from "../types/RecepcaoDados";

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

        const resultQuery = await Query(
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

async function TratarDados() {
    const redis = await redisStartConnection();
    const chaves = await redis.keys("*");

    console.log(chaves);

    for (let chaveIndex = 0; chaveIndex < chaves.length; chaveIndex++) {
        const conteudoChave = await redis.get(chaves[chaveIndex]);
        if (conteudoChave == null)
            continue;

        const dadosMedicao: IDadosEstacao = JSON.parse(conteudoChave);

        const parametrosMedicao = Object.getOwnPropertyNames(dadosMedicao).filter((n) => n != "uid" && n != "uxt");
        for (let paramIndex = 0; paramIndex < parametrosMedicao.length; paramIndex++) {
            if ((await EstacaoPossuiSensorParametro(dadosMedicao.uid, parametrosMedicao[paramIndex])) == false)
                continue;

            const valorMedicao = parseFloat(dadosMedicao[parametrosMedicao[paramIndex]]);
            const valorTratado = await TratarParametro(dadosMedicao.uid, parametrosMedicao[paramIndex], valorMedicao);

            const timezoneOffset = -3 * 60 * 60 * 1000;
            const dataCorrigida = new Date(Math.floor(parseFloat(dadosMedicao.uxt)) * 1000 + timezoneOffset).toISOString()
            const medicao: ICadastrarMedicao = {
                sensor: {
                    id: await GetSensorID(dadosMedicao.uid, parametrosMedicao[paramIndex])
                },
                data_hora: dataCorrigida,
                valor_calculado: valorTratado
            } as ICadastrarMedicao;
            await RegistrarMedicao(medicao);
        }

        redis.del(chaves[chaveIndex]);
    }
}

export {
    TratarDados
}