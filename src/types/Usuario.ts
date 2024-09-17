export interface ICadastrarUsuario { 
    nome: string, 
    email: string, 
    senha: string 
}


export interface IListarUsuario { 
    id: number, 
    nome: string, 
    email: string 
}

export interface IAtualizarUsuario { 
    id: number, 
    nome: string, 
    email: string, 
    senha: string 
}

export interface IDeletarUsuario { 
    id: number 
}

