import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const video = document.getElementById('video');
const status = document.getElementById('status');
const toggleBtn = document.getElementById('toggle');
const clearBtn = document.getElementById('clear');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let handLandmarker;
let showParticleHand = true;
let trailAlpha = 0.08;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

class Particle {
  constructor(targetX, targetY) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.targetX = targetX;
    this.targetY = targetY;
    this.size = 2.0 + Math.random() * 1.8;
    this.color = hsl(${Math.random() * 60 + 300}, 100%, 65%);
    this.density = 10 + Math.random() * 30;
  }
  update() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const speed = 0.12 + (this.density / 100);
      this.x += dx * speed;
      this.y += dy * speed;
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function initMediaPipe() {
  try {
    status.textContent = "MediaPipe model yüklənir... (bu 5-20 saniyə çəkə bilər)";
    status.style.color = "yellow";

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });

    status.textContent = "Model yükləndi ✓ Kamera açılır...";
    status.style.color = "lime";
    startVideo();
  } catch (err) {
    console.error("MediaPipe xətası:", err);
    status.textContent = "Model yüklənmədi! Brauzer konsolunu yoxla (F12). Xəta: " + err.message;
    status.style.color = "red";
    status.style.fontSize = "20px";
  }
}

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = stream;
    video.onloadedmetadata = async () => {
      await video.play();
      status.textContent = "Kamera aktiv ✓ Əlinizi göstərin ✋";
      status.style.color = "#0f0";
      requestAnimationFrame(processVideo);
    };
  } catch (err) {
    console.error("Kamera xətası:", err);
    status.textContent = "Kameraya icazə verilməyib və ya tapılmadı! Brauzer ayarlarını yoxlayın.";
    status.style.color = "orange";
    status.style.fontSize = "20px";
  }
}

async function processVideo() {
  if (video.readyState >= video.HAVE_CURRENT_DATA && handLandmarker) {
    const results = await handLandmarker.detectForVideo(video, performance.now());

    ctx.fillStyle = rgba(0,0,0,${trailAlpha});
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks?.length > 0 && showParticleHand) {
      const landmarks = results.landmarks[0];
      const toPixel = (lm) => ({
        x: (1 - lm.x) * canvas.width,
        y: lm.y * canvas.height
      });

      if (particles.length < 21) {
        particles = landmarks.map(lm => {
          const pos = toPixel(lm);
          return new Particle(pos.x, pos.y);
        });
      } else {
        landmarks.forEach((lm, i) => {
          const pos = toPixel(lm);
          particles[i].targetX = pos.x;
          particles[i].targetY = pos.y;
        });
      }

      HAND_CONNECTIONS.forEach(([a, b]) => {
        const p1 = toPixel(landmarks[a]);
        const p2 = toPixel(landmarks[b]);
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const ix = p1.x + (p2.x - p1.x) * t;
          const iy = p1.y + (p2.y - p1.y) * t;
          const temp = new Particle(ix, iy);
          temp.size *= 0.6;
          temp.color = '#ff99dd';
          temp.update();
          temp.draw();
        }
      });

      particles.forEach(p => { p.update(); p.draw(); });

      status.textContent = "Əl tapıldı – Particle skelet aktiv ✋";
      status.style.color = "#0f0";
    } else {
      status.textContent = showParticleHand ? "Əl axtarılır... (əlinizi göstərin)" : "Particle effekti söndürülüb";
      status.style.color = showParticleHand ? "#f66" : "#aaa";
    }
  }
  requestAnimationFrame(processVideo);
}

toggleBtn.addEventListener('click', () => {
  showParticleHand = !showParticleHand;
  toggleBtn.textContent = showParticleHand ? "Particle Əl Effekti (Aktiv)" : "Particle Əl Effekti (Söndürülüb)";
  if (!showParticleHand) particles = [];
});

clearBtn.addEventListener('click', () => {
  particles = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Başlat
initMediaPipe();
