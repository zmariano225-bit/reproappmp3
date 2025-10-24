// Elementos del DOM
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progress = document.getElementById('progress');
const volumeSlider = document.getElementById('volume');
const visualizerEl = document.getElementById('visualizer');

// Variables
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationId = null;

// Inicializar visualizador
function initVisualizer() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioPlayer);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    visualizerEl.innerHTML = '';
    for (let i = 0; i < bufferLength; i++) {
      const bar = document.createElement('div');
      visualizerEl.appendChild(bar);
    }
  }
}

// Animar visualizador con colores cambiantes
function animateVisualizer() {
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  const bars = visualizerEl.children;
  const time = Date.now() * 0.001;

  for (let i = 0; i < bars.length; i++) {
    const value = dataArray[i] || 0;
    const height = Math.max(2, value / 2.2);
    bars[i].style.height = `${height}px`;
    const hue = (time * 20 + i * 10) % 360;
    bars[i].style.background = `hsl(${hue}, 80%, 60%)`;
  }
  animationId = requestAnimationFrame(animateVisualizer);
}

// Cargar la única canción al iniciar
fetch('playlist.json')
  .then(res => res.json())
  .then(data => {
    const cancion = data.canciones[0];
    audioPlayer.src = cancion.archivo;
  })
  .catch(err => {
    console.error('Error al cargar la pista:', err);
  });

// Reproducir / pausar
playBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play()
      .then(() => {
        playBtn.textContent = '⏸';
        initVisualizer();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
        animateVisualizer();
      })
      .catch(e => {
        console.warn('Reproducción bloqueada:', e);
        playBtn.textContent = '▶';
      });
  } else {
    audioPlayer.pause();
    playBtn.textContent = '▶';
    cancelAnimationFrame(animationId);
    animationId = null;
  }
});

// Progreso
audioPlayer.addEventListener('timeupdate', () => {
  const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
  progress.value = percent;
});

progress.addEventListener('input', () => {
  const time = (progress.value / 100) * audioPlayer.duration;
  audioPlayer.currentTime = time || 0;
});

// Volumen
volumeSlider.addEventListener('input', () => {
  audioPlayer.volume = volumeSlider.value;
});

// Botones de navegación (solo reinician la misma pista)
prevBtn.addEventListener('click', () => {
  audioPlayer.currentTime = 0;
  if (!audioPlayer.paused) audioPlayer.play();
});

nextBtn.addEventListener('click', () => {
  audioPlayer.currentTime = 0;
  if (!audioPlayer.paused) audioPlayer.play();
});