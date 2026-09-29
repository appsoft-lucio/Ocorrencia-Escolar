import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataOcorrenciaParaISO, diaSemanaOcorrencia, rotuloHorario, maiorFrequencia } from '../src/utils/relatorios.js';
test('datas brasileiras e ISO preservam o dia da semana e rejeitam datas invalidas', () => {
  assert.equal(dataOcorrenciaParaISO('25/09/2026, 14:40:00'), '2026-09-25');
  assert.equal(diaSemanaOcorrencia('25/09/2026, 14:40:00'), 'Sexta-feira');
  assert.equal(diaSemanaOcorrencia('2026-09-28T07:00:00-03:00'), 'Segunda-feira');
  assert.equal(dataOcorrenciaParaISO('31/02/2026'), '');
  assert.equal(diaSemanaOcorrencia(''), '');
  assert.equal(rotuloHorario('3'), '3\u00aa aula');
});
test('destaques consideram empates e estado vazio', () => {
  assert.equal(maiorFrequencia([], 'nome'), 'Sem registros');
  assert.equal(maiorFrequencia([{ nome: 'A', ocorrencias: 3 }, { nome: 'B', ocorrencias: 3 }, { nome: 'C', ocorrencias: 1 }], 'nome'), 'A, B (3)');
});
