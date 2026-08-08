/* glcontext.js — CRIAR O CONTEXTO WEBGL DO JEITO MENOS EXIGENTE QUE FUNCIONAR.
   ═══════════════════════════════════════════════════════════════════════════════════
   O RELATO QUE COMPROU ESTE ARQUIVO (07/08/2026)

   Jogador em Arch Linux + Wayland, Firefox e Brave, GPU NVIDIA discreta:

     THREE.WebGLRenderer: A WebGL context could not be created.
     VENDOR = 0x10de, GL_RENDERER = ANGLE (Mesa, llvmpipe (LLVM 22.1.8, 256 bits)),
     ErrorMessage = BindToCurrentSequence failed

   Leia com atenção, porque o diagnóstico está na linha: o `VENDOR` é NVIDIA, mas o
   `GL_RENDERER` **já é llvmpipe** — o navegador tinha desistido do hardware e caído para
   software, e falhou mesmo assim. Isso é máquina/driver dele, não código nosso.

   MAS O PEDIDO ERA NOSSO, E ERA O MAIS EXIGENTE POSSÍVEL:

     new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })

   Duas opções, dois modos de falha conhecidos em Linux:
     · `powerPreference: 'high-performance'` pede explicitamente a GPU discreta. Em
       máquina híbrida (Optimus, PRIME, Wayland com NVIDIA) isso escolhe um dispositivo
       que pode falhar em ligar, enquanto o padrão do navegador teria escolhido o que
       funciona.
     · `antialias: true` pede MSAA, que é alocação a mais no momento de criar o contexto
       — a primeira coisa a falhar quando a memória do driver está no limite ou o
       caminho é software.

   Então a régua é: **degrade o pedido antes de desistir**. Cada degrau abaixo é uma
   mitigação com motivo, não tentativa aleatória, e o que funcionou é anunciado no evento
   `webgl_degradado` — sem isso a gente conserta às cegas da próxima vez.

   O QUE ESTE MÓDULO NÃO FAZ: prometer que vai funcionar. Se todos os degraus falharem
   ele devolve `null`, e **quem chama decide** — o jogo mostra mensagem que o jogador
   entende, o fundo decorativo do site simplesmente não desenha. Essa distinção é o
   ponto: fundo 3D que derruba a página /sobre é defeito pior que fundo ausente.
   ═══════════════════════════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

/* Os degraus, do mais exigente ao mais humilde. `rotulo` entra na telemetria: saber que
   um jogador só entra com `sem-msaa` é informação, e é a única forma de descobrir que
   uma opção nossa estava barrando gente. */
const DEGRAUS = [
  { rotulo: 'alto-desempenho', extra: { antialias: true, powerPreference: 'high-performance' } },
  { rotulo: 'padrao',          extra: { antialias: true } },
  { rotulo: 'sem-msaa',        extra: { antialias: false } },
  { rotulo: 'minimo',          extra: { antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false } },
];

/**
 * Cria um WebGLRenderer descendo os degraus até um funcionar.
 * @param {object} base opções fixas do chamador (canvas, alpha, …) — nunca degradadas
 * @returns {THREE.WebGLRenderer|null} `null` quando NENHUM degrau funcionou
 */
export function criaRenderer(base = {}) {
  let ultimoErro = null;
  for (const d of DEGRAUS) {
    try {
      const r = new THREE.WebGLRenderer({ ...base, ...d.extra });
      /* Só é notícia quando NÃO foi o primeiro degrau: contexto criado no primeiro é o
         caminho de todo mundo e não precisa render evento nenhum. */
      if (d !== DEGRAUS[0]) {
        try {
          window.va?.('event', { name: 'webgl_degradado', data: { degrau: d.rotulo } });
          console.warn(`[webgl] contexto criado no degrau "${d.rotulo}" — o pedido cheio falhou`);
        } catch (_) { /* telemetria nunca atrapalha */ }
      }
      return r;
    } catch (e) {
      ultimoErro = e;
      /* three já loga o motivo detalhado do navegador (VENDOR, GL_RENDERER, ErrorMessage);
         repetir aqui só encheria o console de quem vai ler o relato do jogador. */
    }
  }
  try {
    /* A MARCA SOBE AQUI, e não só no painel: o overlay vermelho de `index.astro` se cala
       quando ela existe. Sem isso, a página /sobre de quem não tem WebGL ganhava um
       stack trace por cima do conteúdo por causa de um fundo DECORATIVO — barulho que
       ensina o jogador a ignorar aviso, que é o oposto do que o overlay existe pra fazer. */
    window.__semWebgl = true;
    window.va?.('event', { name: 'sem_webgl', data: { ua: String(navigator.userAgent).slice(0, 120) } });
    /* `console.error` é capturado pelo coletor de `index.astro` e agrupado por
       fingerprint — é assim que a gente descobre QUANTOS Rafaéis existem, em vez de
       saber de um porque ele mandou mensagem. */
    console.error('sem_webgl: nenhum dos ' + DEGRAUS.length + ' degraus criou contexto · ' + ((ultimoErro && ultimoErro.message) || ultimoErro));
  } catch (_) {}
  return null;
}

/* Painel para o caso em que o 3D é O PRODUTO (o jogo). Fora daqui — fundo do site,
   preview — a resposta certa é não desenhar e seguir a vida. */
export function avisaSemWebgl(erro) {
  try {
    window.__semWebgl = true;   // o overlay de crash do index.astro se cala com isto
    const el = document.createElement('div');
    el.id = 'sem-webgl';
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:8vw;background:#090704;color:#f4efe6;font:16px/1.6 system-ui,sans-serif;text-align:center';
    el.innerHTML = '<div style="max-width:46rem">'
      + '<h1 style="font-size:1.6rem;margin:0 0 1rem">Seu navegador não conseguiu abrir o 3D</h1>'
      + '<p style="margin:0 0 1rem">O jogo precisa de <strong>WebGL</strong>, e o navegador não conseguiu criar o contexto gráfico nesta máquina. '
      + 'Quase sempre é driver de vídeo ou aceleração por hardware desligada — não é a sua internet, e não é o servidor.</p>'
      + '<p style="margin:0 0 1rem;opacity:.85">O que costuma resolver: ligar a <em>aceleração de hardware</em> nas configurações do navegador; '
      + 'atualizar o driver de vídeo; testar outro navegador. No Linux com GPU NVIDIA, driver desatualizado ou sessão Wayland sem o driver certo é a causa mais comum. '
      + 'Para conferir o que o seu navegador suporta: <a style="color:#ffc233" href="https://get.webgl.org/" rel="noopener">get.webgl.org</a>.</p>'
      + '<p style="margin:0;opacity:.6;font-size:.85em">Detalhe técnico: ' + String((erro && erro.message) || erro || 'contexto não criado').slice(0, 200) + '</p>'
      + '</div>';
    (document.body || document.documentElement).appendChild(el);
  } catch (_) { /* se nem isso der, o overlay de crash ainda mostra alguma coisa */ }
}
