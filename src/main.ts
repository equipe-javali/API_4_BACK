require("dotenv-ts").config();

import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
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

const PORT = process.env.PORT || 3001;
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

// roda o serviço a cada X minutos para tratar os dados guardados no redis
const { DELAY_TRATAMENTO } = process.env
setTimeout(async () => {
  await TratarDados();
}, 1000 * 60 * (DELAY_TRATAMENTO ? parseInt(DELAY_TRATAMENTO) : 5));

app.listen(
  PORT,
  function () {
    console.log(`API aberta na porta ${PORT}`);
  }
);

module.exports = app;