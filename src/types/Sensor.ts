export interface ICadastrarSensor {
    nome: string,
    id_parametro: number
};

export interface IListarSensor {
    id: number,
    nome: string,
    id_parametro: number
};

export interface IAtualizarSensor {
    id: number,
    nome: string,
    id_parametro: number
};

export interface IDeletarSensor {
    id: number
};