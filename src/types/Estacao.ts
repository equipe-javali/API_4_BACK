export interface ICadastroEstacao {
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
};

export interface IAtualizacaoEstacao {
    id: number,
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
};