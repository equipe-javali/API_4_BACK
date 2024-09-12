# API_4_BACK
Referente ao Backend da API do quarto semestre da FATEC

## Descrição das branches
Cada branch é referente a uma tarefa ou um conjunto de tarefas.

- X: Exemplo - Responsável

## Padrão de branch
"Task-{numero da tarefa referente a branch}"

"Task-1"    
"Task-2"

## Padrão de Commit
"{numero da tarefa referente a branch} - {descrição do que fez}"    
"{tipo de commit}: {descrição do que fez}"

"1.1 - Adição da rota de cadastro de ativo"     
"fix: Correção na exibição do elemento X"

### Tipos de Commit

* fix - Indica que o trecho de código commitado está solucionando um problema ou bug.
* docs - Indica que houveram mudanças na documentação.
* test - Indica que houveram alterações criando, alterando ou excluindo testes;
* build - Indica que houveram alterações relacionadas a build do projeto/dependências.
* refactor - Indica que uma parte do código foi refatorada sem alterar nenhuma funcionalidade.
* ci - Indica mudanças relacionadas a integração contínua (Continuous Integration).
* cleanup - Indica a remoção de código comentado ou trechos desnecessários no código-fonte.
* remove - Indica a exclusão de arquivos, diretórios ou funcionalidades obsoletas ou não utilizadas.

# Endpoints

## Estação `estacao/`

### POST - Cadastrar `cadastrar/`

| Atributo | Descrição | Obrigatório | Limite | Exemplo |
| -------- | --------- | ----------- | ------ | ------- |
| nome        | Nome da estação     | Sim | N/A       | Estação teste SJC |
| endereco    | Endereço geográfico | Sim | N/A       | 12247-014, Avenida Cesare Monsueto Giulio Lattes, 1350 |
| latitude    | Latitude            | Sim | -90/+90   | -23.162503 |
| longitude   | Longitude           | Sim | -180/+180 | -45.794618 |
| mac_address | Endereço físico MAC | Sim | N/A       | 00:00:5E:00:02:01 |

#### Request Body
```
{
    nome: string,
    endereco: string,
    latitude: number,
    longitude: number,
    mac_address: string
}
```

#### Response Body
```
{
    errors: Array<string>,
    msg: Array<string>,
    data: any
}
```