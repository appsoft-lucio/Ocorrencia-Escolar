import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { criarRelatorioPdf } from '../src/utils/relatorioPdf.js';

test('PDF pagina graficos longos e preserva todos os nomes e valores', async () => {
 const dados=Array.from({length:40},(_,i)=>({nome:`Professor exemplo ${String(i+1).padStart(2,'0')} com nome completo para verificar quebra`,ocorrencias:40-i}));
 const pdf=criarRelatorioPdf({resumo:{ocorrencias:820,alunos:40,turmas:9,professores:40,tipos:7},destaques:[],graficos:[{titulo:'Professores',chave:'nome',dados}],geradoEm:'29/09/2026'});
 assert.ok(pdf.getNumberOfPages()>2);
 const task=getDocument({data:new Uint8Array(pdf.output('arraybuffer')),useSystemFonts:true});
 const doc=await task.promise;
 let texto='';
 for(let i=1;i<=doc.numPages;i++) {
  const page=await doc.getPage(i);
  const content=await page.getTextContent();
  texto+=content.items.map(item=>item.str).join(' ')+' ';
  for(const item of content.items.filter(item=>item.str.trim())) {
   assert.ok(item.transform[4]>=0 && item.transform[4]<=page.view[2]);
   assert.ok(item.transform[5]>=0 && item.transform[5]<=page.view[3]);
  }
 }
 for(let i=1;i<=40;i++) assert.ok(texto.includes(`Professor exemplo ${String(i).padStart(2,'0')}`));
 await task.destroy();
});
