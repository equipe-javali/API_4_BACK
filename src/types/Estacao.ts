export interface ICadastrarEstacao {
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
};

export interface ISensor {
    id: number,
    nome: string
};

export interface IListarEstacao {
    id: number,
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string,
    sensores: ISensor[]
};

export interface IAtualizarEstacao {
    id: number,
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
    id_sensores?: Array<number>
};

export interface IDeletarEstacao {
    id: number
};