/* ratchet-check.mjs — O RATCHET SÓ ANDA PRA FRENTE.
   ═══════════════════════════════════════════════════════════════════════════════════
   O `KNOWN-RED.json` lista invariantes críticas que estão VERMELHAS e não reprovam o
   CI (dívida declarada). Sem régua, a lista é uma mão de duas pontas: quem quebra uma
   invariante nova pode só acrescentar o ID ali e o portão fica verde — virou lista de
   desculpas em vez de dívida.

   O QUE ESTE SCRIPT FAZ (portão de PR)
     R1 · compara o `KNOWN-RED.json` do PR com o da `main`:
            entrada NOVA  → reprova, a menos que o corpo do PR justifique;
            entrada REMOVIDA → passa (é quitação de dívida).
     R2 · a exceção é EXPLÍCITA: uma linha no corpo do PR no formato
            ratchet: +<ID> porque <motivo>
            só libera aquele ID específico. Sem o motivo escrito, não passa —
            o objetivo não é proibir, é obrigar a dizer por quê.
     R3 · reporta o saldo: quantas dívidas entraram, quantas saíram.

   NÃO toca no `invariants.mjs` — o comportamento de rodar o portão é o mesmo.

   USO
     node tools/eval/ratchet-check.mjs                 # compara com origin/main (local/CI)
     node tools/eval/ratchet-check.mjs --base=v1.2.0   # base explícita
     PR_BODY="$(cat body.md)" node tools/eval/ratchet-check.mjs   # corpo do PR para a exceção
   ═══════════════════════════════════════════════════════════════════════════════════ */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const val = (k, d) => { const v = (args.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1]; return v === undefined ? d : v; };
const BASE = val('base', 'origin/main');

const IDs = (json) => Object.keys(json.dividas || {});

let atual;
try {
  atual = JSON.parse(readFileSync(new URL('./KNOWN-RED.json', import.meta.url), 'utf8'));
} catch (e) {
  console.error('✗ RAT0  não consegui ler tools/eval/KNOWN-RED.json:', e.message);
  process.exit(1);
}

let baseIDs = null;
try {
  const txt = execSync(`git show ${BASE}:tools/eval/KNOWN-RED.json`, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  baseIDs = IDs(JSON.parse(txt));
} catch (e) {
  console.log(`· RAT0  base ${BASE} sem KNOWN-RED.json (${e.message.split('\n')[0]}) — sem comparativo, nada a reprovar`);
}

const atuais = new Set(IDs(atual));
const entradas = baseIDs ? baseIDs.filter((id) => !atuais.has(id)) : [];   // quitadas
const novas = baseIDs ? [...atuais].filter((id) => !baseIDs.includes(id)) : [];   // novas dívidas

const body = process.env.PR_BODY || '';
const linhaRatchet = /^\s*ratchet:\s*(.+)$/m.exec(body);
const motivos = new Map();
if (linhaRatchet) {
  for (const m of body.matchAll(/ratchet:\s*([+-]?)([A-Z0-9_]+)(?:\s+porque\s+(.+))?/gim)) {
    motivos.set(m[2].toUpperCase(), { libera: m[1] !== '-', motivo: m[3] || '' });
  }
}

console.log(`RÉGUA DE RATCHET   base ${BASE}\n`);
console.log(`Dívidas na main:   ${baseIDs ? baseIDs.length : 'n/d'}   no PR: ${atuais.size}`);

const semMotivo = novas.filter((id) => !motivos.has(id) || !motivos.get(id).motivo.trim());
console.log(`\nR1 · entradas NOVAS no KNOWN-RED: ${novas.length}`);
if (novas.length) console.log(`     ${novas.join(', ')}`);
for (const id of novas) {
  const ok = motivos.has(id) && motivos.get(id).motivo.trim();
  console.log(`   · ${id}  ${ok ? 'liberada por ratchet: motivo presente' : 'REPROVA — precisa de ratchet: +ID porque <motivo>'}`);
}
console.log(`     ${semMotivo.length === 0 ? 'PASSA' : 'FALHA'}\n`);

console.log(`R2 · entradas REMOVIDAS (quitação): ${entradas.length}`);
if (entradas.length) console.log(`     ${entradas.join(', ')} — saíram da dívida`);
console.log(`     PASSA\n`);

console.log(`R3 · saldo: +${novas.length} novas, −${entradas.length} quitadas → ${novas.length - entradas.length} líquido`);

const passou = semMotivo.length === 0;
console.log(`\n${passou
  ? '✓ RATC1  ratchet só andou para frente (novas justificadas ou ausentes)'
  : '✗ RATC1  dívida nova sem motivo escrito — escreva ratchet: +<ID> porque <motivo> no corpo do PR'}`);
process.exit(passou ? 0 : 1);