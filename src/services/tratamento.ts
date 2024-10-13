import { IDadosEstacao } from "../types/RecepcaoDados";
import { Pool } from "pg";
import { StartConnection, EndConnection, Query } from "./postgres";

async function TratarDados() {
    // aqui vamos buscar os dados do redis, fazer o tratamento necessário e então os armazenar no postgres
}

export {
    TratarDados
}