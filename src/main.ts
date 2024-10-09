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

require("dotenv-ts").config();

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

app.listen(
  PORT,
  function () {
    console.log(`API aberta na porta ${PORT}`);
  }
);

module.exports = app;