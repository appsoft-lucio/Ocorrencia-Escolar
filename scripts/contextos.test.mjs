import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement, useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

let server;
let AuthContext;
let OcorrenciaContext;
let OcorrenciaProvider;
let useProfessores;
const memory = new Map();

before(async () => {
  globalThis.localStorage = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  server = await createServer({
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: "custom",
  });
  ({ AuthContext } = await server.ssrLoadModule('/src/context/AuthContext.js'));
  ({ OcorrenciaContext } = await server.ssrLoadModule('/src/context/OcorrenciaContext.js'));
  ({ OcorrenciaProvider } = await server.ssrLoadModule('/src/context/OcorrenciaContext.jsx'));
  ({ useProfessores } = await server.ssrLoadModule('/src/hooks/useProfessores.js'));
});

after(async () => {
  await server?.close();
  delete globalThis.localStorage;
});

function readContext(user) {
  let result;
  function Probe() {
    result = useContext(OcorrenciaContext);
    return null;
  }
  renderToStaticMarkup(createElement(AuthContext.Provider, { value: { user } },
    createElement(OcorrenciaProvider, null, createElement(Probe))));
  return result;
}

test('local occurrences load before rendering and remain isolated by school', () => {
  const a = [{ id: 'a', turma: '101', turno: 'Manha' }];
  const b = [{ id: 'b', turma: '201', turno: 'Tarde' }];
  memory.set('ocorrencias:school-a', JSON.stringify(a));
  memory.set('ocorrencias:school-b', JSON.stringify(b));
  assert.deepEqual(readContext({ id: 'one', escolaId: 'school-a', role: 'diretor' }).ocorrencias, a);
  assert.deepEqual(readContext({ id: 'two', escolaId: 'school-b', role: 'diretor' }).ocorrencias, b);
  assert.equal(memory.get('ocorrencias:school-a'), JSON.stringify(a));
  assert.deepEqual(readContext(null).ocorrencias, []);
  assert.deepEqual(readContext({ escolaId: 'school-a', role: 'desenvolvedor' }).ocorrencias, []);
});

test('remote occurrences start loading without exposing local demonstration records', () => {
  const result = readContext({ id: 'remote', escolaId: 'school-a', role: 'diretor', origem: 'supabase' });
  assert.deepEqual(result.ocorrencias, []);
  assert.equal(result.loading, true);
});

test('professors are initialized from their school and absent accounts stay empty', () => {
  memory.set('professores:school-a', JSON.stringify([{ id: 'p', nome: 'Teacher' }]));
  function read(user) {
    let result;
    function Probe() { result = useProfessores(user); return null; }
    renderToStaticMarkup(createElement(Probe));
    return result;
  }
  assert.equal(read({ escolaId: 'school-a', role: 'diretor' }).professores[0].id, 'p');
  assert.deepEqual(read({ escolaId: 'school-b', role: 'diretor' }).professores, []);
  assert.deepEqual(read(null).professores, []);
  assert.equal(read({ escolaId: 'school-a', role: 'diretor', origem: 'supabase' }).loadingProfessores, true);
});
