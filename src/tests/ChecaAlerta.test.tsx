import { ChecaAlerta } from '../services/tratamento';
import { IAlertaParametro } from '../types/RecepcaoDados';

describe('ChecaAlerta', () => {
  test('deve retornar true quando valor é menor que alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '<', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 5);
    expect(resultado).toBe(true);
  });

  test('deve retornar false quando valor não é menor que alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '<', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 15);
    expect(resultado).toBe(false);
  });

  test('deve retornar true quando valor é maior que alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '>', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 15);
    expect(resultado).toBe(true);
  });

  test('deve retornar false quando valor não é maior que alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '>', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 5);
    expect(resultado).toBe(false);
  });

  test('deve retornar true quando valor é menor ou igual a alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '<=', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 10);
    expect(resultado).toBe(true);
  });

  test('deve retornar false quando valor não é menor ou igual a alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '<=', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 15);
    expect(resultado).toBe(false);
  });

  test('deve retornar true quando valor é maior ou igual a alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '>=', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 10);
    expect(resultado).toBe(true);
  });

  test('deve retornar false quando valor não é maior ou igual a alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '>=', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 5);
    expect(resultado).toBe(false);
  });

  test('deve retornar true quando valor é igual a alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '=', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 10);
    expect(resultado).toBe(true);
  });

  test('deve retornar false quando valor não é igual a alerta.valor', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: '=', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 5);
    expect(resultado).toBe(false);
  });

  test('deve retornar false para condição desconhecida', () => {
    const alerta: IAlertaParametro = { id: 1, nome_json: 'parametro1', condicao: 'desconhecida', nome: 'Alerta 1', valor: 10 };
    const resultado = ChecaAlerta(alerta, 10);
    expect(resultado).toBe(false);
  });
});