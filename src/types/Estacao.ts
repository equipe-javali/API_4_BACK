export interface ICadastrarEstacao {
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
};

export interface IListarEstacao {
    id: number
};

export interface IListarPaginaEstacao {
    id: number
};

export interface IAtualizarEstacao {
    id: number,
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
};

export interface IDeletarEstacao {
    id: number
};