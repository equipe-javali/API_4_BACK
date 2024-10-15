export interface IDadosEstacao {
    uid: string,
    uxt: string,
    [key: string]: any; // Permite que a estação envie os dados dos sensores sendo obrigatório apenas `uid` e `uxt`
};

export interface ICadastrarMedicao {
    sensor: {
        id: number
    },
    data_hora: string,
    valor_calculado: number
};

export interface IAlertaParametro {
    id: number,
    nome_json: string,
    condicao: string,
    nome: string,
    valor: number
};