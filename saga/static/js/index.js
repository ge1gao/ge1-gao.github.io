// Video comparisons: scene x camera-path selector, all tiles of a selection played in sync.
// Files: static/videos/<scene>_<path>_<method>.mp4 (written by prepare_videos.sbatch).
// Labels: size of the whole coded sequence | PSNR | SSIM, the numbers of the qualitative figures.
const SCENES = [
  { id: 'flame_steak', name: 'Neu3D · flame_steak', ar: '4 / 3', methods: [
    ['saga', 'SAGA (Ours)', '1.91 MB · 34.50 dB · 0.959'],
    ['gifstream', 'GIFStream', '4.33 MB · 32.22 dB · 0.949'],
    ['omg4', 'OMG4', '2.69 MB · 33.39 dB · 0.958']] },
  { id: 'sear_steak', name: 'Neu3D · sear_steak', ar: '4 / 3', methods: [
    ['saga', 'SAGA (Ours)', '1.93 MB · 34.64 dB · 0.960'],
    ['gifstream', 'GIFStream', '3.25 MB · 31.79 dB · 0.945'],
    ['omg4', 'OMG4', '2.36 MB · 33.34 dB · 0.958']] },
  { id: 'cut_roasted_beef', name: 'Neu3D · cut_roasted_beef', ar: '4 / 3', methods: [
    ['saga', 'SAGA (Ours)', '1.34 MB · 34.00 dB · 0.953'],
    ['gifstream', 'GIFStream', '3.56 MB · 31.99 dB · 0.942'],
    ['omg4', 'OMG4', '2.01 MB · 33.33 dB · 0.950']] },
  { id: 'miv_d01', name: 'MPEG MIV · Painter', ar: '16 / 9', methods: [
    ['saga', 'SAGA (Ours)', '1.90 MB · 35.48 dB · 0.958'],
    ['gifstream', 'GIFStream', '2.12 MB · 35.39 dB · 0.954'],
    ['omg4', 'OMG4', '2.33 MB · 35.46 dB · 0.945']] },
  { id: 'miv_e01', name: 'MPEG MIV · Frog', ar: '16 / 9', methods: [
    ['saga', 'SAGA (Ours)', '3.75 MB · 28.22 dB · 0.899'],
    ['gifstream', 'GIFStream', '5.03 MB · 25.19 dB · 0.851']] },
  { id: 'basketball', name: 'Panoptic · basketball', ar: '16 / 9', methods: [
    ['saga', 'SAGA (Ours)', '1.74 MB · 30.32 dB · 0.935'],
    ['gifstream', 'GIFStream', '4.00 MB · 28.76 dB · 0.916']] },
  { id: 'boxes', name: 'Panoptic · boxes', ar: '16 / 9', methods: [
    ['saga', 'SAGA (Ours)', '1.18 MB · 30.30 dB · 0.943'],
    ['gifstream', 'GIFStream', '3.53 MB · 30.22 dB · 0.929']] },
];

const PATHS = [
  { id: 'spiral', name: 'Spiral', note: 'The camera circles the test camera with a forward/backward dolly while the sequence plays.' },
  { id: 'sweep', name: 'Bullet time', note: 'Time is frozen at one frame while the camera sweeps left to right across the rig.' },
  { id: 'test', name: 'Test view', note: 'The held-out test camera at every frame, the view the metrics are computed on.' },
];

const state = { scene: SCENES[0], path: PATHS[0], playing: true };
const grid = document.getElementById('video-grid');

function segment(container, items, current, onPick) {
  container.innerHTML = '';
  items.forEach(item => {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.textContent = item.name;
    b.setAttribute('aria-selected', item === current ? 'true' : 'false');
    b.addEventListener('click', () => onPick(item));
    container.appendChild(b);
  });
}

function videos() { return Array.from(grid.querySelectorAll('video')); }

function render() {
  segment(document.getElementById('scene-seg'), SCENES, state.scene, s => { state.scene = s; render(); });
  segment(document.getElementById('path-seg'), PATHS, state.path, p => { state.path = p; render(); });
  document.getElementById('path-note').textContent = state.path.note;

  const { scene, path } = state;
  grid.style.setProperty('--cols', scene.methods.length);
  grid.style.setProperty('--ar', scene.ar);
  grid.innerHTML = '';
  scene.methods.forEach(([key, name, stats]) => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (key === 'saga' ? ' ours' : '');
    tile.innerHTML = `<div class="tile-label"><b>${name}</b>${stats}</div>`;
    const v = document.createElement('video');
    v.src = `static/videos/${scene.id}_${path.id}_${key}.mp4`;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.addEventListener('error', () => {
      const m = document.createElement('div');
      m.className = 'missing';
      m.textContent = 'Video not available yet';
      v.replaceWith(m);
    });
    tile.appendChild(v);
    grid.appendChild(tile);
  });

  // Keep every tile on the first one's clock; they drift apart after a few loops otherwise.
  const vs = videos();
  if (vs.length) {
    vs[0].addEventListener('timeupdate', () => {
      videos().slice(1).forEach(v => {
        if (Math.abs(v.currentTime - vs[0].currentTime) > 0.12) v.currentTime = vs[0].currentTime;
      });
    });
  }
  if (state.playing) playAll();
}

function playAll() { videos().forEach(v => v.play().catch(() => {})); }

document.addEventListener('DOMContentLoaded', () => {
  render();

  const toggle = document.getElementById('play-toggle');
  toggle.addEventListener('click', () => {
    state.playing = !state.playing;
    state.playing ? playAll() : videos().forEach(v => v.pause());
    toggle.textContent = state.playing ? 'Pause' : 'Play';
  });
  document.getElementById('restart').addEventListener('click', () => {
    videos().forEach(v => { v.currentTime = 0; });
    if (state.playing) playAll();
  });

  // The framework figure stays hidden until static/images/framework.png exists.
  const framework = document.querySelector('#framework-figure img');
  framework.addEventListener('error', () => { document.getElementById('framework-figure').hidden = true; });
  if (framework.complete && framework.naturalWidth === 0) document.getElementById('framework-figure').hidden = true;

  const copy = document.getElementById('copy-bib');
  copy.addEventListener('click', () => {
    const text = document.getElementById('bib-text').textContent;
    const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1500); };
    const select = () => {
      const r = document.createRange();
      r.selectNodeContents(document.getElementById('bib-text'));
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      copy.textContent = 'Press Ctrl+C';
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, select);
    else select();
  });
});
