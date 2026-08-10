// Componente raiz do editor: monta a sidebar e o palco, instancia a réplica
// (VmStage) e o painel, e liga o ciclo de vida (start/stop por troca de aba).
// A página (/editor) só chama mountEditor(host); todo o estado mora aqui.
import { Project } from './project.js';
import { VmStage } from './scene/vm.js';
import { mountVmPanel } from './panels/vm-panel.js';
import { MapProject } from './mapproject.js';
import { MapStage } from './scene/map.js';
import { mountMapPanel } from './panels/map-panel.js';

export async function mountEditor(root) {
  const project = new Project();
  const side = root.querySelector('#side-editor');
  const host = root.querySelector('#host-editor');
  const ov = root.querySelector('#ov-editor');
  const sideMap = root.querySelector('#side-map');
  const hostMap = root.querySelector('#host-map');

  await preloadRuntimes();

  const stage = new VmStage(host, ov, project);
  const panel = mountVmPanel(side, project, stage);

  const mapProject = new MapProject('meu_mapa');
  const mapStage = new MapStage(hostMap, mapProject);
  const mapPanel = mountMapPanel(sideMap, mapProject, mapStage);

  let active = 'editor';
  const tabs = root.querySelectorAll('#devtabs button');
  tabs.forEach((b) => (b.onclick = () => activate(b.dataset.tab)));

  function activate(name) {
    if (name === active) return;
    stage.stop();
    mapStage.stop();
    tabs.forEach((tb) => tb.classList.toggle('on', tb.dataset.tab === name));
    active = name;
    const editorOn = name === 'editor';
    host.style.display = editorOn ? '' : 'none';
    hostMap.style.display = editorOn ? 'none' : '';
    if (ov) ov.style.display = editorOn ? '' : 'none';
    side.hidden = !editorOn;
    sideMap.hidden = editorOn;
    if (editorOn) stage.start();
    else { mapStage.renderAll(); mapStage.start(); }
  }

  stage.start();

  return { project, stage, panel, mapProject, mapStage, mapPanel, activate };
}

// Pré-carrega as libs do jogo UMA vez (a mesma fronteira do boot do main.js).
let _ready = null;
function preloadRuntimes() {
  if (!_ready) {
    _ready = Promise.all([
      import('../weapons.js').then((m) => m.preloadWeapons()),
      import('../audio.js').then(() => {}),
    ]);
  }
  return _ready;
}