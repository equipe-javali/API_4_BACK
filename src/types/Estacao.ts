export interface ICadastrarEstacao {
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
};

export interface IListarEstacao {
    id: number,
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
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