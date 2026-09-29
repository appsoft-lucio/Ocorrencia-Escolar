import { test } from 'node:test';
import assert from 'node:assert/strict';
import { podeAcessarTurno } from '../src/utils/turnos.js';

for (const role of ['vice_diretor', 'coordenador', 'coordenacao']) {
  test(`${role}: isola cada turno, incluindo registros sem turno`, () => {
    for (const turno of ['Manha', 'Tarde', 'Noite']) {
      const user = { role, turno };
      for (const outro of ['Manha', 'Tarde', 'Noite', 'Integral', '', null]) {
        assert.equal(podeAcessarTurno(user, { turno: outro }), turno === outro);
      }
    }
    assert.equal(podeAcessarTurno({ role, turno: 'Manh\u00e3' }, { turno: ' MANHA ' }), true);
    for (const turno of ['', null, 'Integral', 'Nao informado']) {
      assert.equal(podeAcessarTurno({ role, turno }, { turno }), false);
    }
  });
}
test('preserva acesso dos demais perfis e bloqueia usuario ausente', () => {
  for (const role of ['diretor', 'direcao', 'professor', 'desenvolvedor']) {
    assert.equal(podeAcessarTurno({ role }, { turno: 'Noite' }), true);
  }
  assert.equal(podeAcessarTurno(null, { turno: 'Manha' }), false);
});
