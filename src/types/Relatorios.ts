export interface IArquivo {
    nomeArquivo: string,
    tabelas: IGraficos[]
}

export interface IBarras {
    y: number,
    x: string
}

export interface ILeituraSensor {
    sensor: string,
    estacao: string,
    unidade: string,
    data_hora: Date,
    valor: number
}

export interface IFiltroRelatorios {
    dataInicio?: Date,
    dataFim?: Date,
    estacoes?: number[]
}

export interface IGraficos {
    dados: string[][],
    titulo: string,
    subtitulos: string[]
}

export interface IPontoMapa {
    latitude: number,
    longitude: number
}

export interface IRelatorios {
    mapaEstacoes: IGraficos,
    alertaPorEstacoes: IGraficos,
    medicaoPorSensor: IGraficos,
    ocorrenciaPorAlerta: IGraficos,
    temperatura: IGraficos,
    umidade: IGraficos
};