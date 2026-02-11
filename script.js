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
let handLandmarker = null;
let showParticleHand = true;
let trailAlpha = 0.07;

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // thumb
  [0,5],[5,6],[6,7],[7,8],       // index
  [5,9],[9,10],[10,11],[11,12],  // middle
  [9,13],[13,14],[14,15],[15,16],// ring
  [13,17],[17,18],[18,19],[19,20],// pinky
  [0,17]
];

class Particle {
  constructor(tx, ty) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.targetX = tx;
    this.targetY = ty;
    this.size = 2 + Math.random() * 2;
    this.color = hsl(${300 + Math.random()*60}, 100%, 60%);
    this.density = 12 + Math.random() * 25;
  }
  update() {
    let dx = this.targetX - this.x;
    let dy = this.targetY - this.y;
    let dist = Math.hypot(dx, dy);
    if (dist > 1.5) {
      let speed = 0.11 + this.density/120;
      this.x += dx * speed;
      this.y += dy * speed;
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
  }
}

async function init() {
  status.textContent = "Model yüklənir... (10-30 saniyə çəkə bilər)";
  status.style.color = "yellow";

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });

    status.textContent = "Model hazır ✓ Kamera açılır...";
    status.style.color = "lime";
    await openCamera();
  } catch (err) {
    console.error("Model xətası:", err);
    status.textContent = "Model yüklənmədi: " + err.message;
    status.style.color = "red";
  }
}

async function openCamera() {
  status.textContent = "Kamera icazəsi alınır...";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: {ideal:1280}, height:{ideal:720} }
    });
    video.srcObject = stream;

    video.onloadedmetadata = async () => {
      status.textContent = "Video hazır, oynadılır...";
      await video.play().catch(e => console.error("Play xətası:", e));
      status.textContent = "Kamera aktiv ✓ Əlinizi göstərin ✋";
      status.style.color = "#0f0";
      requestAnimationFrame(detectLoop);
    };

    video.onerror = e => {
      console.error("Video error:", e);
      status.textContent = "Video xətası: " + (e.message || "Bilinmir");
      status.style.color = "red";
    };
  } catch (err) {
    console.error("getUserMedia xətası:", err);
    status.textContent = "Kamera xətası: " + err.name + " – " + err.message;
    status.style.color = "orange";
  }
}

async function detectLoop() {
  if (!handLandmarker || video.readyState < 2) {
    requestAnimationFrame(detectLoop);
    return;
  }

  const results = await handLandmarker.detectForVideo(video, performance.now());

  ctx.fillStyle = rgba(0,0,0,${trailAlpha});
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (results.landmarks?.length > 0 && showParticleHand) {
    const lm = results.landmarks[0];
    const toPix = p => ({ x: (1 - p.x) * canvas.width, y: p.y * canvas.height });

    if (particles.length < 21) {
      particles = lm.map(p => {
        const pos = toPix(p);
        return new Particle(pos.x, pos.y);
      });
    } else {
      lm.forEach((p, i) => {
        const pos = toPix(p);
        particles[i].targetX = pos.x;
        particles[i].targetY = pos.y;
      });
    }

    HAND_CONNECTIONS.forEach(([a,b]) => {
      const p1 = toPix(lm[a]);
      const p2 = toPix(lm[b]);
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const ix = p1.x + t * (p2.x - p1.x);
        const iy = p1.y + t * (p2.y - p1.y);
        const tp = new Particle(ix, iy);
        tp.size *= 0.65;
        tp.color = '#ff88cc';
        tp.update();
        tp.draw();
      }
    });

    particles.forEach(p => { p.update(); p.draw(); });

    status.textContent = "Əl tapıldı ✋";
    status.style.color = "#0f0";
  } else {
    status.textContent = showParticleHand ? "Əl axtarılır..." : "Effekt söndürülüb";
    status.style.color = showParticleHand ? "#ff6666" : "#888";
  }

  requestAnimationFrame(detectLoop);
}

toggleBtn.onclick = () => {
  showParticleHand = !showParticleHand;
  toggleBtn.textContent = showParticleHand ? "Particle Əl (Aktiv)" : "Particle Əl (Söndür)";
  if (!showParticleHand) particles = [];
};

clearBtn.onclick = () => {
  particles = [];
  ctx.clearRect(0,0,canvas.width,canvas.height);
};

window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

init();
