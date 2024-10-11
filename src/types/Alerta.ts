export interface ICadastrarAlerta {
    id_estacao: number,
    id_parametro: number,
    condicao: string,
    nome: string,
    valor: number
};

export interface IListarAlerta {
    id: number,
    id_estacao: number,
    id_parametro: number,
    condicao: string,
    nome: string,
    valor: number
};

export interface IAtualizarAlerta {
    id: number,
    id_estacao: number,
    id_parametro: number,
    condicao: string,
    nome: string,
    valor: number
};

export interface IDeletarAlerta {
    id: number
};