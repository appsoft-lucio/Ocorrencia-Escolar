import { test } from 'node:test';
import assert from 'node:assert/strict';
import { podeAcessarTurma, podeAcessarProfessor, codigosTurmasAtivas } from '../src/utils/turnos.js';

const turmas = [
  { codigo: '101', turno: 'Manha' },
  { codigo: '201', turno: 'Tarde' },
  { codigo: '301', turno: 'Noite' },
];
test('professor acessa turmas vinculadas em qualquer turno, ignorando turno legado', () => {
  const user = { id: 'p', role: 'professor', turno: 'Manha', turmas: ['101', '201', '301'] };
  for (const turma of turmas) {
    assert.equal(podeAcessarTurma(user, turma), true);
    assert.equal(podeAcessarTurma(user, { turma: turma.codigo, turno: turma.turno }), true);
  }
  assert.equal(podeAcessarTurma(user, { codigo: '999', turno: 'Manha' }), false);
});
test('ausencia de vinculo e vinculo inativo nao concedem acesso', () => {
  for (const vinculos of [[], undefined, [{ codigo: '101', status: 'inativo' }]]) {
    assert.equal(podeAcessarTurma({ role: 'professor', turmas: vinculos }, turmas[0]), false);
  }
  assert.deepEqual(codigosTurmasAtivas([{ codigo: '201', status: 'ativo' }, { codigo: '101', status: 'inativo' }]), ['201']);
});
test('gestao continua restrita ao turno; professor e encontrado pelos vinculos', () => {
  for (const role of ['vice_diretor', 'coordenador']) {
    const user = { role, turno: 'Tarde' };
    assert.equal(podeAcessarTurma(user, turmas[0]), false);
    assert.equal(podeAcessarTurma(user, turmas[1]), true);
    assert.equal(podeAcessarProfessor(user, { turmas: ['101', '201', '301'] }, turmas), true);
    assert.equal(podeAcessarProfessor(user, { turno: 'Tarde', turmas: ['101'] }, turmas), false);
    assert.equal(podeAcessarProfessor({ role }, { turmas: ['201'] }, turmas), false);
  }
  assert.equal(podeAcessarProfessor({ role: 'diretor' }, { turmas: [] }), true);
});
