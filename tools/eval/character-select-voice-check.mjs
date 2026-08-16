#!/usr/bin/env node
/* A fala pertence ao clique no avatar, não à seleção automática que monta a tela.
   O índice no elenco precisa produzir um arquivo distinto do pool da própria facção. */
import { readFileSync } from 'node:fs';

const mutante = process.argv.find((arg) => arg.startsWith('--mutante='))?.slice(10) || '';
if (mutante && !['sem-clique', 'auto-fala', 'mesmo-som'].includes(mutante)) {
  console.error(`mutante desconhecido: ${mutante}`);
  process.exit(2);
}

let main = readFileSync('public/js/main.js', 'utf8');
if (mutante === 'sem-clique') {
  main = main.replace(
    'row.onclick = () => selectCharacterFromAvatar(c, row, chars);',
    'row.onclick = () => selectChar(c, row);',
  );
}
if (mutante === 'auto-fala') {
  main = main.replace('if (row) selectChar(character, row);', 'row?.click();');
}

const failures = [];
const expect = (ok, message) => { if (!ok) failures.push(message); };
const selectStart = main.indexOf('function selectChar(c, row) {');
let depth = 0, selectEnd = -1;
for (let i = main.indexOf('{', selectStart); i >= 0 && i < main.length; i += 1) {
  if (main[i] === '{') depth += 1;
  if (main[i] === '}' && --depth === 0) { selectEnd = i + 1; break; }
}
const selectBody = selectStart >= 0 && selectEnd > selectStart ? main.slice(selectStart, selectEnd) : '';

expect(/row\.onclick\s*=\s*\(\)\s*=>\s*selectCharacterFromAvatar\(c, row, chars\)/.test(main),
  'VOICE1 o clique do avatar não chama o fluxo de fala');
expect(/function selectCharacterFromAvatar\(c, row, roster\)[\s\S]*selectChar\(c, row\)[\s\S]*characterSelectVoice\(c\.id, c\.team, roster\.map/.test(main),
  'VOICE2 o fluxo clicado não seleciona e fala pelo id/facção/elenco reais');
expect(!/characterSelectVoice/.test(selectBody),
  'VOICE3 selectChar fala durante a montagem automática da tela');
expect(!/row\?\.click\(\)/.test(main),
  'VOICE4 a query string simula clique humano e dispara fala');

globalThis.location ||= { search: '' };
const { Sfx } = await import('../../public/js/audio.js');
const probe = new Sfx();
probe.pack = { voice: { T: ['audio/t-0.mp3', 'audio/t-1.mp3', 'audio/t-2.mp3'] } };
const played = [];
let paused = 0;
probe._sample = (file) => { played.push(file); return { pause: () => { paused += 1; } }; };
if (mutante === 'mesmo-som') {
  probe.characterSelectVoice = function () {
    this._characterSelectAudio?.pause();
    this._characterSelectAudio = this._sample(this.pack.voice.T[0]);
    return true;
  };
}

const roster = ['alfa', 'beta', 'gama'];
if (typeof probe.characterSelectVoice === 'function') {
  const results = roster.map((id) => probe.characterSelectVoice(id, 'T', roster));
  probe.characterSelectVoice('alfa', 'T', roster);
  expect(results.every(Boolean), 'VOICE5 algum personagem com pool suficiente ficou sem fala');
  expect(new Set(played.slice(0, 3)).size === roster.length,
    `VOICE6 personagens compartilharam fala: ${played.slice(0, 3).join(', ')}`);
  expect(played[0] === played[3], 'VOICE7 o mesmo personagem mudou de fala entre cliques');
  expect(paused === 3, `VOICE8 a fala anterior não foi interrompida (pausas=${paused})`);
  probe.speechEnabled = false;
  expect(probe.characterSelectVoice('beta', 'T', roster) === false && played.length === 4,
    'VOICE9 a preferência de desligar falas não foi respeitada');
} else {
  failures.push('VOICE5 Sfx.characterSelectVoice não existe');
}

if (mutante) {
  if (failures.length) {
    console.log(`✓ mutante ${mutante}: ${failures.length} cláusula(s) vermelha(s); a régua morde`);
    process.exit(0);
  }
  console.error(`✗ mutante ${mutante} sobreviveu`);
  process.exit(1);
}

if (failures.length) {
  console.error(`CHARACTER-SELECT-VOICE VERMELHA (${failures.length})`);
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exit(1);
}
console.log('CHARACTER-SELECT-VOICE VERDE — clique fala; montagem silencia; identidade 1:1 preservada.');
