import Excel from 'exceljs';
import express, { Request, Response } from "express";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, Query } from "../services/postgres";
import { IBarras, IGraficos, IFiltroRelatorios, IPontoMapa, IRelatorios, IArquivo, ILeituraSensor } from "../types/Relatorios";

const router = express.Router();

/**
 * @swagger
 * /relatorio/geral:
 *  post:
 *      tags: [Relatório]
 *      summary: Lista relatórios
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          dataInicio:
 *                              type: string
 *                              format: date
 *                          dataFim:
 *                              type: string
 *                              format: date
 *                          estacoes:
 *                              type: array
 *                              items:
 *                                  type: number
 *      responses:
 *          200:
 *              description: Alertas listados com sucesso
 *          500:
 *              description: Falha ao listar alertas
 */
router.post(
    "/geral",
    async function (req: Request, res: Response) {
        const {
            dataInicio,
            dataFim,
            estacoes
        } = req.body as IFiltroRelatorios;

        let filtroMapa = '';
        let filtroSensor = '';
        let filtroEstacao = '';
        let filtroAlerta = '';
        let filtroLeitura = '';
        const queryEstacoes = estacoes ?? [];
        const queryParams: any[] = [];

        if (estacoes) {
            const ids = estacoes?.map((_, index) => `$${index + 1}`).join(", ");
            filtroMapa = `WHERE id IN (${ids})`
            filtroEstacao += ` "a".id_estacao IN (${ids})`
            filtroLeitura += `"e".id in (${ids})`
        }

        if (dataInicio) {
            filtroSensor += `"m".data_hora >= $1`;
            filtroEstacao += (filtroEstacao && ' AND ') + `"o".data_hora >= $${queryEstacoes.length + 1}`;
            filtroAlerta += `"o".data_hora >= $1`;
            filtroLeitura += (filtroLeitura && ' AND ') + `"m".data_hora >= $${queryEstacoes.length + 1}`;
            queryParams.push(dataInicio);
        }

        if (dataFim) {
            filtroSensor += (filtroSensor && ' AND ') + `"m".data_hora <= $${queryParams.length + 1}`;
            filtroEstacao += (filtroEstacao && ' AND ') + `"o".data_hora <= $${queryEstacoes.length + queryParams.length + 1}`;
            filtroAlerta += (filtroAlerta && ' AND ') + `"o".data_hora <= $${queryParams.length + 1}`;
            filtroLeitura += (filtroLeitura && ' AND ') + `"m".data_hora <= $${queryEstacoes.length + queryParams.length + 1}`;
            queryParams.push(dataFim);
        }

        if (filtroSensor) filtroSensor = `WHERE ${filtroSensor}`;
        if (filtroEstacao) filtroEstacao = `WHERE ${filtroEstacao}`;
        if (filtroAlerta) filtroAlerta = `WHERE ${filtroAlerta}`;
        if (filtroLeitura) filtroLeitura = `WHERE ${filtroLeitura}`;

        let bdConn: Pool | null = null;
        try {
            bdConn = StartConnection();
            /* MAPA DAS ESTAÇÕES */
            const resultQueryMapaEstacoes = await Query<IPontoMapa>(
                bdConn,
                `SELECT latitude, longitude FROM estacao ${filtroMapa};`,
                [...queryEstacoes]
            );

            /* RELATÓRIO DE MÉDIA POR SENSOR */
            const resultQueryMediaSensor = await Query<IBarras>(
                bdConn,
                `SELECT concat("s".nome, ' (', "e".nome, ')') as x, avg("m".valor_calculado) as y FROM medicao "m" INNER JOIN sensor "s" ON "s".id = "m".id_sensor INNER JOIN sensorestacao "se" ON "se".id_sensor = "s".id INNER JOIN estacao "e" ON "e".id = "se".id_estacao INNER JOIN parametro "p" ON "p".id = "s".id_parametro ${filtroSensor} GROUP BY "s".id, "e".id, "p".id;`,
                [...queryParams]
            );

            /* RELATÓRIO DE ALERTAS POR ESTAÇÃO */
            const resultQueryAlertaEstacao = await Query<IBarras>(
                bdConn,
                `SELECT "e".nome as x, count(*) as y FROM ocorrencia "o" INNER JOIN alerta "a" ON "a".id = "o".id_alerta INNER JOIN estacao "e" ON "e".id = "a".id_estacao ${filtroEstacao} GROUP BY "e".id;`,
                [...queryEstacoes, ...queryParams]
            );

            /* RELATÓRIO DE OCORRÊNCIAS POR ALERTA */
            const resultQueryOcorrenciaAlerta = await Query<IBarras>(
                bdConn,
                `SELECT "a".nome as x, count(*) as y FROM ocorrencia "o" INNER JOIN alerta "a" ON "a".id = "o".id_alerta INNER JOIN estacao "e" ON "e".id = "a".id_estacao ${filtroAlerta} GROUP BY "a".id;`,
                [...queryParams]
            );

            /* RELATÓRIO DE LEITOR */
            const resultQueryLeituraSensor = await Query<ILeituraSensor>(
                bdConn,
                `SELECT "s".nome as sensor, "e".nome as estacao, "u".nome as unidade, TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM "m".data_hora) / (1 * 60)) * (1 * 60)) AS data_hora, AVG("m".valor_calculado) as valor FROM medicao "m" INNER JOIN sensor "s" ON "s".id = "m".id_sensor INNER JOIN sensorestacao "se" ON "se".id_sensor = "s".id INNER JOIN estacao "e" ON "e".id = "se".id_estacao INNER JOIN parametro "p" ON "p".id = "s".id_parametro INNER JOIN unidade_medida "u" ON "u".id = "p".id_unidade ${filtroLeitura} GROUP BY "s".nome, "e".nome, "u".nome, TO_TIMESTAMP(FLOOR(EXTRACT(EPOCH FROM "m".data_hora) / (1 * 60)) * (1 * 60));`,
                [...queryEstacoes, ...queryParams]
            );

            const relatoriosTemperaturaTratada: ILeituraSensor[] = [];
            const relatoriosUmidadeTratada: ILeituraSensor[] = [];

            /* NORMALIZAÇÃO DOS LEITORES */
            resultQueryLeituraSensor.forEach((query: ILeituraSensor) => {
                let valor = query.valor;
                let tipo: 'temperatura' | 'umidade' | undefined;

                if (query.unidade) {
                    if (query.unidade === '°F') {
                        valor = (valor - 32) * 5 / 9;
                        tipo = 'temperatura';
                    } else if (query.unidade === '°K') {
                        valor = valor - 273.15;
                        tipo = 'temperatura';
                    } else if (query.unidade === '°C') {
                        tipo = 'temperatura';
                    } else if (query.unidade === '%') {
                        tipo = 'umidade';
                    }
                }

                if (tipo === 'temperatura') {
                    relatoriosTemperaturaTratada.push({
                        sensor: query.sensor,
                        estacao: query.estacao,
                        data_hora: query.data_hora,
                        valor: valor,
                        unidade: '°C'
                    });
                } else if (tipo === 'umidade') {
                    relatoriosUmidadeTratada.push({
                        sensor: query.sensor,
                        estacao: query.estacao,
                        data_hora: query.data_hora,
                        valor: valor,
                        unidade: '%'
                    });
                }
            });

            const relatorios: IRelatorios = {
                mapaEstacoes: {
                    dados: resultQueryMapaEstacoes.map((ponto: IPontoMapa) => [ponto.longitude.toString(), ponto.latitude.toString()]),
                    subtitulos: ['Longitude (coordenada)', 'Latitude (coordenada)'],
                    titulo: 'Coordenadas das estações'
                },
                alertaPorEstacoes: {
                    dados: resultQueryAlertaEstacao.map((dado: IBarras) => [dado.x.toString(), dado.y.toString()]),
                    subtitulos: ['Estação (nome)', 'Alertas (quantidade)'],
                    titulo: 'Quantidade de alertas por estação'
                },
                medicaoPorSensor: {
                    dados: resultQueryMediaSensor.map((dado: IBarras) => [dado.x.toString(), dado.y.toString()]),
                    subtitulos: ['Sensor (nome)', 'Medição (valor)'],
                    titulo: 'Média de medição por sensor'
                },
                ocorrenciaPorAlerta: {
                    dados: resultQueryOcorrenciaAlerta.map((dado: IBarras) => [dado.x.toString(), dado.y.toString()]),
                    subtitulos: ['Alerta (nome)', 'Ocorrência (quantidade)'],
                    titulo: 'Quantidade de ocorrências por alerta'
                },
                temperatura: {
                    dados: relatoriosTemperaturaTratada.map((dado: ILeituraSensor) => [dado.sensor, dado.estacao, dado.data_hora.toString(), dado.valor.toString()]),
                    subtitulos: ['Sensor (nome)', 'Estação (nome)', 'Data e hora (data)', 'Temperatura (ºC)'],
                    titulo: 'Temperatura por sensor a cada 15 minutos'
                },
                umidade: {
                    dados: relatoriosUmidadeTratada.map((dado: ILeituraSensor) => [dado.sensor, dado.estacao, dado.data_hora.toString(), dado.valor.toString()]),
                    subtitulos: ['Sensor (nome)', 'Estação (nome)', 'Data e hora (data)', 'Umidade (mm)'],
                    titulo: 'Umidade por sensor a cada 15 minutos'
                }
            };

            const retorno = {
                errors: [],
                msg: ["Relatório realizado com sucesso"],
                data: {
                    rows: relatorios
                }
            } as IResponsePadrao;
            res.status(200).send(retorno);
        } catch (err) {
            const retorno = {
                errors: [(err as Error).message],
                msg: ["Falha na criação do relatório"],
                data: null
            } as IResponsePadrao;
            res.status(500).send(retorno);
        }
        
    }
);

/**
 * @swagger
 * /relatorio/download:
 *  post:
 *      tags: [Relatório]
 *      summary: Gera e faz download de um arquivo Excel com gráficos.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          nomeArquivo:
 *                              type: string
 *                              description: Nome do arquivo Excel a ser gerado.
 *                          tabelas:
 *                              type: array
 *                              items:
 *                                  type: object
 *                                  properties:
 *                                      dados:
 *                                          type: array
 *                                          description: Dados do gráfico em formato de matriz.
 *                                          items:
 *                                              type: array
 *                                              items:
 *                                                  type: string
 *                                      titulo:
 *                                          type: string
 *                                          description: Título da planilha.
 *                                      subtitulos:
 *                                          type: array
 *                                          description: Subtítulos das colunas da planilha.
 *                                          items:
 *                                              type: string
 *      responses:
 *          200:
 *              description: Arquivo Excel gerado e enviado com sucesso.
 *              content:
 *                  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *                      schema:
 *                          type: string
 *                          format: binary
 *          500:
 *              description: Falha ao gerar o arquivo Excel.
 */
router.post("/download", async function (req: Request, res: Response) {
    const dados: IArquivo = req.body;

    const workbook = new Excel.Workbook();
    workbook.creator = dados.nomeArquivo;
    workbook.created = new Date();

    dados.tabelas.forEach((grafico: IGraficos) => {
        const sheet = workbook.addWorksheet(grafico.titulo);

        const titleRow = sheet.addRow(grafico.subtitulos);
        titleRow.height = 30;
        titleRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        grafico.dados.forEach((dado) => {
            const row = sheet.addRow(dado);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            row.height = 30;
        });

        titleRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        sheet.getColumn(1).width = 80;
        sheet.getColumn(2).width = 80;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(dados.nomeArquivo)}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
});

export {
    router as RelatorioRouter
};
