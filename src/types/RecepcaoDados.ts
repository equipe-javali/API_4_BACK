export interface IDadosEstacao {
    uid: string,
    uxt: number,
    [key: string]: any; // Permite que a estação envie os dados dos sensores sendo obrigatório apenas `uid` e `uxt`
};