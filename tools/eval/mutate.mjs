#!/usr/bin/env node
/* Mutation testing do viewmodel. `tools/eval/mutantes.json` é o catálogo:
   cada mutante é um patch (de/para) + a régua que deveria ficar vermelha.
   O motor aplica, roda a régua, restaura no finally e reporta MATOU/SOBREVIVEU.
   Ctrl-C/SIGTERM no meio restauram imediatamente — a prova é feita com
   `--demo-interrompe` (aplica e espera; mande `kill -INT PID` e veja o git limpo).
   Mutante novo = edit só no JSON. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CAT = JSON.parse(readFileSync(join(ROOT, 'tools/eval/mutantes.json'), 'utf8'));
const SO = process.argv.find((a) => a.startsWith('--so='))?.slice(5);
const DEMO_INTERROMPE = process.argv.includes('--demo-interrompe');

let childAtivo = null;
let aplicado = null;

function restaura() {
  if (aplicado) {
    writeFileSync(aplicado.caminho, aplicado.original);
    aplicado = null;
  }
}
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    restaura();
    if (childAtivo) childAtivo.kill('SIGTERM');
    process.exit(sinal === 'SIGINT' ? 130 : 143);
  });
}

function rodarRegua(comando, alvo) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = comando.split(/\s+/).filter(Boolean);
    const child = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    childAtivo = child;
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', () => {});
    child.on('close', (code) => {
      childAtivo = null;
      if (code !== 0 && !out.trim()) {
        reject(new Error(`${comando} saiu com código ${code} sem stdout — régua quebrada?`));
        return;
      }
      try {
        const ini = out.indexOf('{');
        const res = JSON.parse(out.slice(ini));
        resolve({ alvoR: res.results.find((r) => r.id === alvo), res });
      } catch (e) {
        reject(new Error(`não consegui ler ${alvo} do JSON da régua: ${e.message}`));
      }
    });
  });
}

async function main() {
  const mutantes = SO ? CAT.mutantes.filter((m) => m.id === SO) : CAT.mutantes;
  if (!mutantes.length) throw new Error(`nenhum mutante (--so=${SO}) no catálogo`);
  let sobrev = 0, falhas = 0;

  for (const m of mutantes) {
    const caminho = join(ROOT, m.arquivo);
    const original = readFileSync(caminho, 'utf8');
    const ocorrencias = original.split(m.de).length - 1;
    if (ocorrencias !== 1) {
      console.log(`ERRO  ${m.id}: '${m.de.slice(0, 40)}…' apareceu ${ocorrencias}× no ${
        m.arquivo} (catálogo desatualizado?)`);
      falhas++;
      continue;
    }
    aplicado = { caminho, original };
    writeFileSync(caminho, original.replace(m.de, m.para), 'utf8');
    try {
      if (DEMO_INTERROMPE) {
        process.stdout.write(`[${m.id}] patch aplicado — aguardando SIGINT (kill -INT ${process.pid})…`);
        await new Promise((r) => setTimeout(r, 30000));
        console.log('\nDEMO  nada deveria chegar aqui (SIGINT não foi entregue?)');
      } else {
        const regua = m.regua || CAT.regua;
        const { alvoR } = await rodarRegua(regua.comando, regua.alvo);
        if (!alvoR) throw new Error(`a régua não emitiu ${regua.alvo}`);
        const v = alvoR.ok === false ? 'MATOU'
          : alvoR.ok === true ? 'SOBREVIVEU'
          : `PULADO (${alvoR.evid || 'sem evidência'})`;
        console.log(`[${m.id}] ${v} ${regua.alvo}`);
        if (alvoR.ok !== false) sobrev++;
      }
    } catch (e) {
      console.log(`ERRO  ${m.id}: ${e.message}`);
      falhas++;
    } finally {
      restaura();
    }
  }

  if (sobrev || falhas) {
    const motivos = (sobrev ? `${sobrev} sobreviveram (invariante cega — achado)` : '') +
      (sobrev && falhas ? ' + ' : '') + (falhas ? `${falhas} erros` : '');
    console.error(`\nFALHOU: ${mutantes.length} mutantes → ${motivos}`);
    process.exit(1);
  }
  console.log(`\nOK: ${mutantes.length} mutantes MATARAM a régua — catálogo morde em todos os buracos documentados`);
}

main().catch((e) => { restaura(); console.error(`\nFALHOU: ${e.message}`); process.exit(1); });