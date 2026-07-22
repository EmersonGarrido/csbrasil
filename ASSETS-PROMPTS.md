# Prompts de geração de personagens (Mint / Meshy / Tripo) — CS BRASIL

Objetivo: gerar cada arquétipo **customizado** (mantém a sátira, sai do Minecraft) como modelo 3D **riggado**. Não usar GLB genérico pronto.

## Especificação comum (cola no começo de TODO prompt)

> Low-poly game-ready 3D character, single humanoid in a clean **T-pose**, stylized **cartoon caricature**, readable silhouette, flat-shaded **PBR**, ~2–4k tris, **rigging-friendly proportions**, centered at origin, facing +Z. Brazilian political-satire archetype — **fictional, not a real person, no real-world logos or text**. Output **GLB**.

Se a ferramenta permitir, peça também: **rigged skeleton with animations: idle, walk, run, shoot, death**. Se só sair o mesh estático, rode depois no **Mixamo** (auto-rig grátis) e exporte as animações — eu ligo no jogo.

## Onde soltar

`public/models/characters/<id>.glb` — usando o `id` exato de cada um abaixo (pra eu mapear automático).

---

## Os 10 personagens

**esquerdomacho** (time P) — *Esquerdomacho*
> ...intellectual "esquerdomacho": thick hipster beard, round glasses, dark red t-shirt, canvas tote bag over the shoulder, jeans, sneakers, several small pin-buttons on the chest, calm academic pose.

**sindicato** (P) — *Líder do Sindicato*
> ...union leader: red baseball cap, gray shirt, open assembly vest, mustache, jeans, work boots, a megaphone held at the hip.

**mst** (P) — *Líder do MST*
> ...rural landless-movement leader: olive/straw work shirt, weathered tan skin, muddy boots, a backpack with a small red flag on a short pole, simple cap.

**doutora** (P) — *Doutora do SUS*
> ...female public-health doctor: white lab coat, stethoscope around neck, hair in a ponytail, ID badge, holding a clipboard, scrubs, sneakers.

**mistico** (P) — *Jovem Místico*
> ...young mystic/hippie: cloth headband, long hair, purple shirt, a crystal pendant on the chest, beaded bracelets, sandals, serene relaxed pose.

**caminhoneiro** (time B) — *Caminhoneiro*
> ...truck driver: yellow soccer-style shirt, driving gloves, cap, jeans, boots, big belt, sturdy build, friendly generic face.

**influencer** (B) — *Influencer de Dubai*
> ...flashy male influencer: gold sunglasses, white designer t-shirt, gold pants, blond hair, white sneakers, thick gold chain, holding a smartphone.

**sertanejo** (B) — *Cantor Sertanejo*
> ...Brazilian country "sertanejo" singer: leather cowboy hat, white t-shirt, large gold belt buckle, jeans, boots, an acoustic guitar on the back, generic friendly face (NOT a real person).

**senhora** (B) — *Tia Zilá*
> ...cheerful 60-year-old auntie: gray hair in a bun, glasses, green blouse, yellow pants, holding a phone, a small board of paper clippings on her back.

**coach** (B) — *Coach Quântico*
> ...motivational "quantum coach": slick blazer, headset microphone, dark slicked hair, white shirt, black pants, dress shoes, confident arms-crossed pose.

---

## Novos (sessão 22/07 — gerados no Mint com imagem de referência)

Estilo pedido pelo usuário nesta leva: **semi-realista** (pelugem/tecido com textura real), NÃO flat cartoon.

**bozo** (time P) — *Bozo*
> ...classic circus clown mascot: white clown face makeup, big round red nose, wide red smile, fluffy red wing-hair tufts on the sides of a bald white head, royal-blue long-sleeve top and matching pants, wide light-blue-and-white cape collar with red zigzag trim, red waist sash, white gloves, white boot covers with red trim over brown shoes. Semi-realistic fabric/latex/greasepaint materials.

**canarinho** (time B) — *Canarinho Pistola*
> ...angry canary bird mascot ("canarinho pistola"): bright yellow feathered body, pointed feather crest on top of the head, big white furrowed angry eyes, orange beak, stocky build with big head, yellow soccer jersey with green collar trim and green number 24 on the chest, blue soccer shorts, white socks, blue soccer boots. Semi-realistic feather/fabric materials.

**proerd** (time B) — *Leão do Proerd*
> ...upright-standing lion mascot (PROERD): tan golden fur, full fluffy dark-red to orange-brown mane, friendly smiling lion face, BLACK t-shirt with red cursive script "Proerd" logo across the chest (white outline), dark blue jeans, sneakers, lion tail with dark-red tuft. Semi-realistic fur/fabric materials. A camisa PRETA com o logo vermelho é OBRIGATÓRIA — sem ela vira um leão genérico (feedback do usuário).

---

## O que eu faço quando os GLB chegarem

1. Adiciono GLTFLoader + AnimationMixer ao jogo (uma vez).
2. Troco os bonecos de caixa pelos modelos reais, mapeando pelo `id`.
3. Ligo as animações no estado do jogo: parado → idle, movendo → walk/run, atirando → shoot, morto → death.
4. Ajusto escala/altura pra bater com a hitbox (afinável, igual às armas).

Armas já estão resolvidas (Quaternius CC0). Props de mapa a gente faz depois, mesmo fluxo (prompt → GLB → eu integro).
