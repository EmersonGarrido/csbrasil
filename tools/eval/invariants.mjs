#!/usr/bin/env node
// ============================================================================
// INVARIANTES — o portão de qualidade do CORO SOLTO.
//
// POR QUE ISTO EXISTE
// O dono passou 3 dias num ciclo em que cada rodada consertava uma coisa e
// quebrava outra, e a gente só descobria uma rodada depois. A causa não era
// falta de cuidado: era falta de RETE. Um crítico (humano ou agente) julga
// screenshot; consistência e flow são propriedades do jogo EM MOVIMENTO, e
// quase todo defeito que ele reportou não é gosto — é invariante violada:
//
//   "as mãos estão soltas no ar"          -> distância mão↔grip tem um teto
//   "a arma aponta pra baixo"             -> o cano tem um ângulo máximo
//   "no ADS não vejo a arma nem a mira"   -> a arma tem área mínima e máxima
//   "sniper sem zoom"                     -> FOV mirando < FOV de quadril
//   "várias armas com visual igual"       -> silhuetas têm que diferir
//   "o bot atira do nada"                 -> dano exige LOS anterior
//   "tem 2 me eliminando"                 -> 1 killfeed por morte
//
// REGRA DE OURO: nada é commitado com invariante VERMELHA. E todo bug novo que
// o dono reportar vira uma invariante aqui — é assim que ele nunca volta.
//
// USO
//   node tools/eval/invariants.mjs            # tudo que roda sem browser
//   node tools/eval/invariants.mjs --json     # saída pra máquina
// Sai com código 1 se qualquer invariante crítica falhar (serve de gate em CI).
//
// ESCOPO
// Este arquivo agrega os arneses que rodam em NODE PURO (sem Chrome/SwiftShader,
// que custa ~4 min por carga de mapa nesta máquina):
//   - botsim.mjs        : a classe Game real + mapas reais, com DOM stubado
//   - vmrig-test.mjs    : o rig procedural de viewmodel a 240 Hz
//   - tp-mount-probe.mjs: mount de arma na 3ª pessoa, parser de GLB próprio
//   - vm_mint_audit.json: enquadramento por arma medido no GLB
// As invariantes que EXIGEM pixel (mira visível no ADS, silhueta) ficam
// marcadas como `browser` e são puladas aqui — rode gl-shots/motion pra elas.
// ============================================================================

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const JSON_OUT = process.argv.includes('--json');

const results = [];
/** @param {string} id @param {string} desc @param {boolean|null} ok @param {string} evid @param {'crit'|'warn'} sev */
const put = (id, desc, ok, evid, sev = 'crit') => results.push({ id, desc, ok, evid, sev });
const skip = (id, desc, why) => results.push({ id, desc, ok: null, evid: why, sev: 'skip' });

const num = (v, d = 3) => (typeof v === 'number' && isFinite(v) ? +v.toFixed(d) : String(v));

function runNode(script, env = {}) {
  try {
    return execFileSync(process.execPath, [join(HERE, script)], {
      cwd: ROOT, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, ...env },
    });
  } catch (e) {
    return (e.stdout || '') + '\n__ERRO__ ' + (e.message || '');
  }
}

// ── 1. SINTAXE ──────────────────────────────────────────────────────────────
// Barato e pega o erro mais caro: um arquivo que não parseia derruba o jogo
// inteiro numa tela preta, e sob SwiftShader isso custa 4 minutos pra descobrir.
{
  const { readdirSync } = await import('node:fs');
  const dir = join(ROOT, 'public', 'js');
  const bad = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    try { execFileSync(process.execPath, ['--check', join(dir, f)], { stdio: 'pipe' }); }
    catch { bad.push(f); }
  }
  put('SYN', 'todos os public/js/*.js parseiam', bad.length === 0, bad.length ? bad.join(', ') : 'ok');
}

// ── 2. VIEWMODEL: enquadramento e cano (vm_mint_audit.json) ─────────────────
// O enquadramento é DERIVADO de len/gripZ medidos no GLB, não tabelado por arma.
// Estes tetos vêm das referências que o dono escolheu (CS 1.6 / ev.io / VALORANT,
// em /root/ref) e do que já tinha sido medido contra o CS2.
{
  const p = join(ROOT, 'tools', 'eval', 'vm_mint_audit.json');
  if (!existsSync(p)) {
    skip('VM*', 'enquadramento do viewmodel', 'vm_mint_audit.json ausente — rode o auditor de VM');
  } else {
    const a = JSON.parse(readFileSync(p, 'utf8'));
    const armas = Array.isArray(a.armas) ? a.armas : (a.weapons || []);
    if (!armas.length) {
      skip('VM*', 'enquadramento do viewmodel', 'audit sem lista de armas');
    } else {
      const g = (w, ...ks) => { for (const k of ks) if (w[k] !== undefined) return w[k]; return undefined; };

      // VM1 — a arma vive no quadrante inferior direito e não invade o centro.
      // "borda esquerda" = fração da largura da tela onde a silhueta começa.
      const esq = armas.map((w) => g(w, 'left169', 'bordaEsq169', 'left')).filter((v) => typeof v === 'number');
      if (esq.length) {
        const min = Math.min(...esq);
        put('VM1', 'borda esquerda do viewmodel ≥ 0,58 (não suja o centro da tela)',
          min >= 0.58, `mín ${num(min)} em ${armas.length} armas`);
      } else skip('VM1', 'borda esquerda do viewmodel', 'campo ausente no audit');

      // VM2 — o antebraço SAI pela borda direita. Se ele termina dentro do quadro
      // vira um toco/cotovelo flutuando: foi exatamente a regressão da rodada 1.
      const dir = armas.map((w) => g(w, 'right169', 'bordaDir169', 'right')).filter((v) => typeof v === 'number');
      if (dir.length) {
        const min = Math.min(...dir);
        put('VM2', 'antebraço sai pela borda direita (≥ 0,99)', min >= 0.99, `mín ${num(min)}`);
      } else skip('VM2', 'antebraço na borda direita', 'campo ausente no audit');

      // VM3 — o cano aponta pra onde a mira aponta. Reclamação literal do dono:
      // "você mira pro meio do mapa, e a arma está apontada pra baixo".
      const ang = armas.map((w) => g(w, 'canoDeg', 'barrelDeg', 'angle')).filter((v) => typeof v === 'number');
      if (ang.length) {
        const max = Math.max(...ang.map(Math.abs));
        put('VM3', 'ângulo do cano ≤ 16° em todas as armas', max <= 16, `máx ${num(max, 1)}°`);
      } else skip('VM3', 'ângulo do cano', 'campo ausente no audit');

      // VM4 — o MESMO enquadramento em 16:9 e 3:2. O dono joga em 3:2 e validar
      // só em 16:9 já custou uma rodada inteira do projeto.
      const dif = armas.map((w) => {
        const a169 = g(w, 'left169', 'bordaEsq169'), a32 = g(w, 'left32', 'bordaEsq32');
        return (typeof a169 === 'number' && typeof a32 === 'number') ? Math.abs(a169 - a32) : null;
      }).filter((v) => v !== null);
      if (dif.length) {
        const max = Math.max(...dif);
        put('VM4', 'enquadramento igual em 16:9 e 3:2 (Δ ≤ 0,03)', max <= 0.03, `Δ máx ${num(max)}`);
      } else skip('VM4', 'paridade 16:9 × 3:2', 'campo ausente no audit');

      // VM5 — nenhuma arma some da tela nem toma a tela. O dono já reclamou dos
      // dois extremos ("armas gigantescas" e depois "não se vê a arma").
      const area = armas.map((w) => g(w, 'area169', 'areaPct169', 'area')).filter((v) => typeof v === 'number');
      if (area.length) {
        const mn = Math.min(...area), mx = Math.max(...area);
        const pct = mn < 1 ? 100 : 1;   // aceita fração ou porcentagem
        put('VM5', 'área da arma na tela entre 3% e 14%', mn * pct >= 3 && mx * pct <= 14,
          `${num(mn * pct, 1)}% a ${num(mx * pct, 1)}%`);
      } else skip('VM5', 'área da arma na tela', 'campo ausente no audit');

      // VM6 — cobertura: as 26 armas passam pelo mesmo caminho. Se o audit tem
      // menos que isso, alguma arma ficou fora do pipeline novo.
      put('VM6', 'as 26 armas passam pelo pipeline de viewmodel', armas.length >= 26,
        `${armas.length} armas auditadas`);
    }
  }
}

// ── 3. RIG PROCEDURAL DO VIEWMODEL (vmrig-test.mjs) ─────────────────────────
// Aqui moram as invariantes de ANIMAÇÃO — o que faz "parecer jogo": ADS curto,
// bob que zera ao parar, recarga que casa com o número, troca sem frame vazio.
{
  if (!existsSync(join(HERE, 'vmrig-test.mjs'))) {
    skip('RIG', 'rig procedural do viewmodel', 'vmrig-test.mjs ausente');
  } else {
    const out = runNode('vmrig-test.mjs');
    const pass = (out.match(/\bPASS\b/g) || []).length;
    const fail = (out.match(/\bFAIL\b/g) || []).length;
    put('RIG', 'rig de viewmodel: ADS/bob/recarga/troca/coice', fail === 0 && pass > 0,
      `${pass} PASS / ${fail} FAIL`);
  }
}

// ── 4. MOUNT DE ARMA NA 3ª PESSOA (tp-mount-probe.mjs) ──────────────────────
// "Dollynho não segura arma nenhuma", "Coach com a arma pra trás", "Ancap não
// segura direito", "ET estranho". A raiz medida: o cano vinha da linha
// antebraço→mão e ficava entre −21° e −35° (apontado pro chão) nos 27
// personagens. Esta invariante impede a volta disso.
{
  if (!existsSync(join(HERE, 'tp-mount-probe.mjs'))) {
    skip('TPM', 'mount de arma na 3ª pessoa', 'tp-mount-probe.mjs ausente');
  } else {
    const out = runNode('tp-mount-probe.mjs');
    const fail = (out.match(/\bFAIL\b/g) || []).length;
    const erro = out.includes('__ERRO__');
    // pitch do cano por personagem, lido da coluna "-> yaw X°/pitch Y°" da seção
    // MOUNT V2 (o resultado DEPOIS do mount). A seção 1 da sonda imprime de
    // propósito o algoritmo ANTIGO como diagnóstico — ler dali dá falso vermelho.
    const pitches = [...out.matchAll(/->\s*yaw\s*(-?\d+(?:[.,]\d+)?)°\s*\/\s*pitch\s*(-?\d+(?:[.,]\d+)?)°/gi)]
      .map((m) => parseFloat(m[2].replace(',', '.')));
    const yaws = [...out.matchAll(/->\s*yaw\s*(-?\d+(?:[.,]\d+)?)°/gi)].map((m) => parseFloat(m[1].replace(',', '.')));
    const piorPitch = pitches.length ? Math.max(...pitches.map(Math.abs)) : null;
    if (yaws.length) {
      const piorYaw = Math.max(...yaws.map(Math.abs));
      put('TPM3', 'nenhuma arma atravessada/pra trás na 3ª pessoa (|yaw| ≤ 20°)', piorYaw <= 20,
        `pior |yaw| ${num(piorYaw, 1)}° em ${yaws.length} personagens`);
    }
    put('TPM1', 'sonda de mount 3ª pessoa roda sem erro e sem FAIL', !erro && fail === 0,
      erro ? out.split('__ERRO__')[1]?.slice(0, 120) : `${fail} FAIL`);
    if (piorPitch !== null) {
      put('TPM2', 'cano na 3ª pessoa não aponta pro chão (|pitch| ≤ 12°)', piorPitch <= 12,
        `pior |pitch| ${num(piorPitch, 1)}° em ${pitches.length} medidas`);
    }
  }
}

// ── 5. BOTS: justiça, legibilidade e movimento (botsim.mjs) ─────────────────
// Roda a classe Game real + mapas reais em node, com sementes fixas. É o que
// permite afirmar "melhorou X%" em vez de "acho que melhorou".
{
  if (!existsSync(join(HERE, 'botsim.mjs'))) {
    skip('BOT', 'simulação de bots', 'botsim.mjs ausente');
  } else {
    const out = runNode('botsim.mjs');
    const media = out.match(/MEDIA[^\n]*/)?.[0] || '';
    const val = (k) => {
      const m = media.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+([\\d.]+)'));
      return m ? parseFloat(m[1]) : null;
    };
    const lat = val('latFlips/min'), spin = val('spin voltas/min'), stuck = val('stuck%');

    // BOT1 — "andando de lado e voltando". Um flip lateral a cada 4 s ainda é
    // visível; o alvo é ≤ 12/min (o projeto já mediu 68-85 antes da saga de A*).
    if (lat !== null) put('BOT1', 'bot não fica indo de lado (latFlips ≤ 12/min)', lat <= 12, `${num(lat, 1)}/min`, 'warn');
    // BOT2 — "rodando em volta de si mesmo".
    if (spin !== null) put('BOT2', 'bot não gira em torno de si (≤ 0,25 volta/min)', spin <= 0.25, `${num(spin, 2)}/min`, 'warn');
    // BOT3 — "travando".
    if (stuck !== null) put('BOT3', 'bot não trava (stuck ≤ 4% do tempo)', stuck <= 4, `${num(stuck, 1)}%`, 'warn');
    if (lat === null && spin === null && stuck === null) {
      skip('BOT*', 'métricas de movimento do bot', 'botsim não imprimiu a linha MEDIA');
    }

    // BOT4 — justiça. Rodada em modo duelo: o jogador tem que ter tempo de
    // reagir entre o primeiro tiro que encosta e a morte. "Morri e entendi por
    // quê" em vez de "morri do nada".
    const duel = runNode('botsim.mjs', { SIM_DUEL: '1' });
    const dmed = duel.match(/MEDIA[^\n]*/)?.[0] || '';
    const dval = (k) => {
      const m = dmed.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+([\\d.]+)'));
      return m ? parseFloat(m[1]) : null;
    };
    const ttk = dval('janela ate morrer (s)');
    const hs = dval('fracCabeca');
    const acc = dval('taxaAcerto');
    const mpm = dval('mortes/min');
    // BOT4 — "o bot me mata do nada". A janela entre o primeiro tiro que encosta
    // e a morte é o número que traduz "deu pra reagir". Abaixo de 3 s o jogador
    // não tem tempo de virar a câmera, procurar cobertura e responder.
    if (ttk !== null) put('BOT4', 'janela entre o 1º tiro e a morte ≥ 3 s', ttk >= 3, `${num(ttk, 2)} s`);
    // BOT5 — "atira sempre na cabeça". Fração dos acertos do bot que são na cabeça.
    if (hs !== null) put('BOT5', 'fração de headshot do bot ≤ 10%', hs <= 0.10, `${num(hs, 3)}`);
    // BOT6 — pontaria sobre-humana. Um bot com taxa de acerto acima de ~22% em
    // combate real lê como aimbot.
    if (acc !== null) put('BOT6', 'taxa de acerto do bot ≤ 22%', acc <= 0.22, `${num(acc, 3)}`, 'warn');
    // BOT7 — ritmo. Morrer mais de 3 vezes por minuto contra bot é frustração.
    if (mpm !== null) put('BOT7', 'jogador morre ≤ 3 vezes/min no duelo', mpm <= 3, `${num(mpm, 2)}/min`, 'warn');
  }
}

// ── 6. ARSENAL: coerência da tabela de armas ────────────────────────────────
// Invariantes que se leem direto do código, sem rodar nada. Baratas e pegam
// classes inteiras de bug que já morderam o projeto.
{
  const gsrc = readFileSync(join(ROOT, 'public', 'js', 'game.js'), 'utf8');
  const wsrc = readFileSync(join(ROOT, 'public', 'js', 'weapons.js'), 'utf8');

  // ARM1 — toda arma com luneta precisa de zoom de verdade. "Snipers sem zoom"
  // é reclamação literal; a solução NÃO é tirar a luneta, é fazer a certa.
  const bloco = gsrc.slice(0, gsrc.indexOf('};', gsrc.indexOf('const WEAPONS')) + 2);
  const linhas = bloco.split('\n').filter((l) => /^\s*\w+:\s*\{/.test(l));
  const semZoom = linhas.filter((l) => /scope:\s*true/.test(l) && !/spreadScope/.test(l))
    .map((l) => l.trim().split(':')[0]);
  put('ARM1', 'toda arma com scope:true declara spreadScope', semZoom.length === 0,
    semZoom.length ? semZoom.join(', ') : `${linhas.length} armas conferidas`);

  // ARM2 — mirar precisa reduzir o spread. Foi o bug que deixou 25 das 26 armas
  // sem ganho nenhum ao mirar.
  const adsGanho = /spreadScope\s*\?\?|p\.scoped\s*\?/.test(gsrc);
  put('ARM2', 'ADS reduz o spread no caminho de tiro', adsGanho, adsGanho ? 'ok' : 'não achei o ramo de spread do ADS');

  // ARM3 — nenhuma arma pode ser desproporcionalmente "alta". Foi a causa real
  // da "uzi maior que o corpo do hipster": o len normaliza o COMPRIMENTO e a
  // altura vinha junto.
  const lens = [...wsrc.matchAll(/(\w+):\s*\{\s*len:\s*([\d.]+)/g)].map((m) => [m[1], parseFloat(m[2])]);
  const gigantes = lens.filter(([k, v]) => !/knife|pistol|deagle|revolver/.test(k) && v > 1.25);
  put('ARM4', 'nenhuma arma longa demais (len ≤ 1,25 m fora de sniper de ferrolho)',
    gigantes.length === 0, gigantes.length ? gigantes.map(([k, v]) => `${k}=${v}`).join(', ') : `${lens.length} armas`, 'warn');

  // ARM5 — 1 killfeed por morte. "voce viu que tem 2 me eliminando esta confuso".
  const feedCalls = (gsrc.match(/this\._feed\(/g) || []).length;
  put('ARM5', 'killfeed emitido de um lugar só por morte', feedCalls <= 3,
    `${feedCalls} chamadas de _feed`, 'warn');
}

// ── 7. ESPAÇO DE JOGO ───────────────────────────────────────────────────────
// C4 da régua nova: a banda de 0-2 m das linhas de tiro tem que estar limpa.
// Nos screenshots do dono há 10+ armas largadas no chão jogável em todo mapa.
{
  const gsrc = readFileSync(join(ROOT, 'public', 'js', 'game.js'), 'utf8');
  const rackConcentrado = /rack|armario|_rack/i.test(gsrc);
  put('ESP1', 'existe rack/armário de armas (em vez de arma espalhada)', rackConcentrado,
    rackConcentrado ? 'ok' : 'não achei rack', 'warn');
}

// ── 8. MODOS ────────────────────────────────────────────────────────────────
// "os mapas todos podem ser rounds ou CTF, mas tem uns que forçam ser CTF".
{
  const msrc = readFileSync(join(ROOT, 'public', 'js', 'maps.js'), 'utf8');
  const forcados = (msrc.match(/ctfOnly:\s*true/g) || []).length;
  put('MOD1', 'nenhum mapa força CTF (ctfOnly removido)', forcados === 0,
    `${forcados} mapas com ctfOnly:true`);
}

// ── 9. INVARIANTES QUE EXIGEM PIXEL (marcadas, não rodadas aqui) ────────────
skip('PX1', 'no ADS o jogador vê a arma E a mira', 'exige browser — use tools/eval/motion.mjs');
skip('PX2', 'silhuetas das 26 armas diferem (IoU par a par < 0,85)', 'exige browser — use tools/eval/motion.mjs');
skip('PX3', 'mão travada no grip em todo frame de toda animação', 'exige browser/traço — use tools/eval/motion.mjs');
skip('PX4', 'aliado × inimigo distinguíveis em 1 frame a 5/20/40 m', 'exige browser');

// ── RELATÓRIO ───────────────────────────────────────────────────────────────
const crit = results.filter((r) => r.sev === 'crit');
const warn = results.filter((r) => r.sev === 'warn');
const falhas = crit.filter((r) => r.ok === false);
const avisos = warn.filter((r) => r.ok === false);

if (JSON_OUT) {
  console.log(JSON.stringify({ results, falhas: falhas.length, avisos: avisos.length }, null, 1));
} else {
  const mark = (r) => (r.ok === null ? '·· PULADO' : r.ok ? '✓ PASSA  ' : '✗ FALHA  ');
  console.log('\n=============== INVARIANTES — CORO SOLTO ===============\n');
  for (const r of results) console.log(`${mark(r)} ${r.id.padEnd(5)} ${r.desc}\n${' '.repeat(16)}${r.evid}`);
  console.log('\n--------------------------------------------------------');
  console.log(`CRÍTICAS: ${crit.filter((r) => r.ok === true).length}/${crit.filter((r) => r.ok !== null).length} passam` +
    (falhas.length ? `  ← ${falhas.map((r) => r.id).join(', ')} VERMELHAS` : '  ← tudo verde'));
  console.log(`AVISOS:   ${avisos.length ? avisos.map((r) => r.id).join(', ') + ' fora do alvo' : 'nenhum'}`);
  console.log(`PULADAS:  ${results.filter((r) => r.sev === 'skip').length} (exigem browser ou arnês ausente)`);
  console.log('--------------------------------------------------------\n');
}

process.exit(falhas.length ? 1 : 0);
