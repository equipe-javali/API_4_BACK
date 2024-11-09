import Excel from 'exceljs';
import express, { Request, Response } from "express";
import { IResponsePadrao } from "../types/Response";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "../services/postgres";
import { IBarras, IGraficos, iFiltroRelatorios, IPontoMapa, IRelatorios, IArquivo } from "../types/Relatorios";

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
            estacoes,
        } = req.body as iFiltroRelatorios;

        let filtroMapa = ''
        let filtroSensor = ''
        let filtroEstacao = ''
        let filtroAlerta = ''

        if (estacoes) {
            const ids = estacoes.join(',')
            filtroMapa = `where id in (${ids})`
            filtroEstacao += ` "a".id_estacao in (${ids})`
        }
        if (dataInicio) {
            filtroSensor += ` "m".data_hora >= '${dataInicio}'`;
            filtroEstacao += (filtroEstacao && " and") + ` "o".data_hora >= '${dataInicio}'`;
            filtroAlerta += `"o".data_hora >= ' ${dataInicio}'`;
        }
        if (dataFim) {
            filtroSensor += (filtroSensor && " and") + ` "m".data_hora <= '${dataFim}'`;
            filtroEstacao += (filtroEstacao && " and") + ` "o".data_hora <= '${dataFim}'`;
            filtroAlerta += (filtroAlerta && " and") + ` "o".data_hora <= '${dataFim}'`;
        }
        if (filtroSensor != '') {
            filtroSensor = 'where' + filtroSensor
        }
        if (filtroEstacao != '') {
            filtroEstacao = 'where' + filtroEstacao
        }
        if (filtroAlerta != '') {
            filtroAlerta = 'where' + filtroAlerta
        }
        let bdConn: Pool | null = null;
        try {
            bdConn = await StartConnection();
            /* MAPA DAS ESTAÇÕES */
            const resultQueryMapaEstacoes = await Query<IPontoMapa>(
                bdConn,
                `SELECT latitude, longitude FROM estacao ${filtroMapa};`,
                []
            );

            /* RELATÓRIO DE MÉDIA POR SENSOR */
            const resultQueryMediaSensor = await Query<IBarras>(
                bdConn,
                `SELECT concat("s".nome, ' (', "e".nome, ')') as x, avg("m".valor_calculado) as y  FROM medicao "m" INNER JOIN sensor "s" ON "s".id = "m".id_sensor  INNER JOIN sensorestacao "se" ON "se".id_sensor = "s".id INNER JOIN estacao "e" ON "e".id = "se".id_estacao INNER JOIN parametro "p" ON "p".id = "s".id_parametro ${filtroSensor} GROUP BY "s".id, "e".id, "p".id;`,
                []
            );

            /* RELATÓRIO DE ALERTAS POR ESTAÇÃO */
            const resultQueryAlertaEstacao = await Query<IBarras>(
                bdConn,
                `SELECT "e".nome as x, count(*) as y FROM ocorrencia "o" INNER JOIN alerta "a" ON "a".id = "o".id_alerta INNER JOIN estacao "e" ON "e".id = "a".id_estacao ${filtroEstacao} GROUP BY "e".id;`,
                []
            );

            /* RELATÓRIO DE OCORRÊNCIAS POR ALERTA */
            const resultQueryOcorrenciaAlerta = await Query<IBarras>(
                bdConn,
                `SELECT "a".nome as x, count(*) as y FROM ocorrencia "o" INNER JOIN alerta "a" ON "a".id = "o".id_alerta INNER JOIN estacao "e" ON "e".id = "a".id_estacao ${filtroAlerta} GROUP BY "a".id;`,
                []
            );

            const relatorios: IRelatorios = {
                mapaEstacoes: {
                    dados: resultQueryMapaEstacoes.rows.map((ponto: IPontoMapa) => [ponto.longitude, ponto.latitude]),
                    subtitulos: ['Longitude (coordenada)', 'Latitude (coordenada)'],
                    titulo: 'Coordenadas das estações'
                },
                alertaPorEstacoes: {
                    dados: resultQueryOcorrenciaAlerta.rows.map((dado: IBarras) => [dado.x.toString(), dado.y.toString()]),
                    subtitulos: ['Estação (nome)', 'Alertas (quantidade)'],
                    titulo: 'Quantidade de alertas por estação'
                },
                medicaoPorSensor: {
                    dados: resultQueryMediaSensor.rows.map((dado: IBarras) => [dado.x.toString(), dado.y.toString()]),
                    subtitulos: ['Sensor (nome)', 'Medição (valor)'],
                    titulo: 'Média de medição por sensor'
                },
                ocorrenciaPorAlerta: {
                    dados: resultQueryOcorrenciaAlerta.rows.map((dado: IBarras) => [dado.x.toString(), dado.y.toString()]),
                    subtitulos: ['Alerta (nome)', 'Ocorrência (quantidade)'],
                    titulo: 'Quantidade de ocorrências por alerta'
                }
            };

            const retorno = {
                errors: [],
                msg: ["Relatório realizado com sucesso"],
                data: {
                    rows: relatorios,
                    fields: [resultQueryMapaEstacoes.fields, resultQueryMediaSensor.fields, resultQueryAlertaEstacao.fields, resultQueryOcorrenciaAlerta.fields]
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
        if (bdConn) EndConnection(bdConn);
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
