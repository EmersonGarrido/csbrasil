#!/usr/bin/env node
/*
 * BUG-40 (09/08): o Release alpha.47 saiu como "CORO SOLTO" e as notas feitas
 * de `git log --oneline` não ligaram o PR #119 a @EmersonGarrido. O GitHub
 * documenta que `--generate-notes` inclui PRs e contribuidores; esta régua cobra
 * isso em todo caminho que chama `gh release create`.
 *
 * RLS3: o alpha.56 entrou sem trailer; cobra DCO em todo commit automático de release.
 *
 * Mutações: --mutante=nome-antigo | semcreditos | semdco.
 */
import { readFileSync } from 'node:fs';

const mutante = process.argv.find((arg) => arg.startsWith('--mutante='))?.split('=')[1];
const arquivos = ['.github/workflows/release.yml', '.github/workflows/ci.yml'];
let comandos = arquivos.flatMap((arquivo) => readFileSync(arquivo, 'utf8')
  .split('\n')
  .filter((linha) => /(?:^\s*|run:\s*)gh release create/.test(linha))
  .map((linha) => ({ arquivo, linha })));
let commitsRelease = readFileSync('.github/workflows/release.yml', 'utf8')
  .split('\n')
  .filter((linha) => /^\s*git commit(?:\s|$)/.test(linha));

if (mutante) {
  const antes = JSON.stringify([comandos, commitsRelease]);
  if (mutante === 'nome-antigo') comandos[0].linha = comandos[0].linha.replace('"CSBR ', '"CORO SOLTO ');
  else if (mutante === 'semcreditos') comandos[0].linha = comandos[0].linha.replace(' --generate-notes', '');
  else if (mutante === 'semdco') {
    const i = commitsRelease.findIndex((linha) => /(?:^|\s)(?:-s|--signoff)(?=\s|$)/.test(linha));
    if (i >= 0) commitsRelease[i] = commitsRelease[i].replace(/\s(?:-s|--signoff)(?=\s|$)/, '');
  }
  else throw new Error(`mutante desconhecido: ${mutante}`);
  if (JSON.stringify([comandos, commitsRelease]) === antes) throw new Error(`MUTANTE NAO APLICOU: ${mutante}`);
}

const nomes = comandos.filter(({ linha }) => /--title "CSBR \$/.test(linha)).length;
const creditos = comandos.filter(({ linha }) => linha.includes('--generate-notes')).length;
const total = comandos.length;
const dco = commitsRelease.filter((linha) => /(?:^|\s)(?:-s|--signoff)(?=\s|$)/.test(linha)).length;
const totalCommits = commitsRelease.length;
const ok = total > 0 && nomes === total && creditos === total && totalCommits > 0 && dco === totalCommits;

console.log(`${nomes === total && total ? '✓' : '✗'} RLS1 título CSBR: ${nomes}/${total} caminhos`);
console.log(`${creditos === total && total ? '✓' : '✗'} RLS2 notas com contribuidores: ${creditos}/${total} caminhos`);
console.log(`${dco === totalCommits && totalCommits ? '✓' : '✗'} RLS3 commits automáticos com DCO: ${dco}/${totalCommits} caminhos`);
if (!ok) {
  console.error('Release inválido: use título CSBR, --generate-notes e `git commit -s` em todo caminho automático.');
  process.exit(1);
}
