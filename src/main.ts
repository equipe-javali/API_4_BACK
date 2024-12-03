require("dotenv-ts").config();

import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { EndConnection as redisEndConnection } from "./services/redis";
import { EndConnection as postgresEndConnection } from "./services/redis";
import { swaggerDocs } from "./swagger/swagger";
import { EstacaoRouter } from "./endpoints/Estacao";
import { UsuarioRouter } from "./endpoints/Usuario";
import { ParametroRouter } from "./endpoints/Parametro";
import { UnidadeMedidaRouter } from "./endpoints/UnidadeMedida";
import { SensorRouter } from "./endpoints/Sensor";
import { AlertaRouter } from "./endpoints/Alerta";
import { RecepcaoDadosRouter } from "./endpoints/RecepcaoDados";
import { TratarDados } from "./services/tratamento";
import { OcorrenciaRouter } from "./endpoints/Ocorrencia";
import { RelatorioRouter } from "./endpoints/Relatorios";

const PORT = (process.env.PORT ? parseInt(process.env.PORT) : 3001);
const app = express();

app.use(require("body-parser").urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/estacao", EstacaoRouter);
app.use("/parametro", ParametroRouter);
app.use("/unidademedida", UnidadeMedidaRouter);
app.use("/usuario", UsuarioRouter);
app.use("/sensor", SensorRouter);
app.use("/alerta", AlertaRouter);
app.use("/ocorrencia", OcorrenciaRouter);
app.use("/recepcaoDados", RecepcaoDadosRouter);
app.use("/relatorio", RelatorioRouter);

// roda o serviço a cada X minutos para tratar os dados guardados no redis
const { DELAY_TRATAMENTO } = process.env;
setTimeout(async () => {
  await TratarDados();
}, 1000 * 60 * (DELAY_TRATAMENTO ? parseInt(DELAY_TRATAMENTO) : 5));

const server = app.listen(
  PORT,
  "0.0.0.0",
  function () {
    console.log(`API aberta na porta ${PORT}`);
  }
);

function FecharConexoes() {
  redisEndConnection();
  postgresEndConnection();
}

process.on('SIGINT', () => {
  console.log("Fechando a API");
  server.close(() => {
    FecharConexoes();
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log("Fechando a API");
  server.close(() => {
    FecharConexoes();
    process.exit(0);
  });
});

module.exports = app;