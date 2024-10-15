export interface ICadastrarParametro {
    unidade_medida: {
        id: number
    },
    nome: string,
    fator: number,
    offset: number,
    nome_json: string
};

export interface IListarParametro {
    id: number,
    unidade_medida: IUnidadeMedida,
    nome: string,
    fator: number,
    offset: number,
    nome_json: string
};

export interface IAtualizarParametro {
    id: number,
    unidade_medida: {
        id: number
    },
    nome: string,
    fator: number,
    offset: number,
    nome_json: string
};

export interface IDeletarParametro {
    id: number
};

export interface IUnidadeMedida {
    id: number,
    nome: string
}