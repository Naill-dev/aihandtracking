import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const video = document.getElementById('video');
const status = document.getElementById('status');
const textInput = document.getElementById('text');
const btn = document.getElementById('create');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let handPos = { x: canvas.width / 2, y: canvas.height / 2, active: false };

class Particle {
  constructor(x, y) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.baseX = x;
    this.baseY = y;
    this.size = 2.8;
    this.color = '#ff44aa';
    this.density = Math.random() * 40 + 10;
  }
  update() {
    const dx = handPos.x - this.x;
    const dy = handPos.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 140 && handPos.active) {
      const force = (140 - dist) / 140;
      this.x -= (dx / dist) * force * this.density;
      this.y -= (dy / dist) * force * this.density;
    } else {
      this.x += (this.baseX - this.x) * 0.085;
      this.y += (this.baseY - this.y) * 0.085;
    }
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

let handLandmarker;

async function initMediaPipe() {
  try {
    status.textContent = "MediaPipe yüklənir...";
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"  // GPU işləmirsə "CPU" yaz
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    status.textContent = "Model hazır ✓";
    startVideo();
  } catch (err) {
    console.error("MediaPipe xətası:", err);
    status.textContent = "Xəta: Model yüklənmədi → " + err.message;
    status.style.color = "red";
  }
}

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    video.srcObject = stream;
    await video.play();
    status.textContent = "Kamera aktiv ✓ Əlinizi göstərin";
    requestAnimationFrame(processVideo);
  } catch (err) {
    console.error("Kamera xətası:", err);
    status.textContent = "Kamera icazəsi verin!";
    status.style.color = "orange";
  }
}

async function processVideo() {
  if (video.readyState >= video.HAVE_CURRENT_DATA && handLandmarker) {
    const now = performance.now();
    const results = await handLandmarker.detectForVideo(video, now);
    if (results.landmarks && results.landmarks.length > 0) {
      const tip = results.landmarks[0][8]; // şəhadət barmağı ucu (index 8)
      handPos.x = (1 - tip.x) * canvas.width;  // mirror effekti
      handPos.y = tip.y * canvas.height;
      handPos.active = true;
      status.textContent = "Əl tapıldı ✋";
      status.style.color = "#0f0";
    } else {
      handPos.active = false;
      status.textContent = "Əl axtarılır...";
      status.style.color = "#f66";
    }
  }
  requestAnimationFrame(processVideo);
}

function createParticles(text = null) {
  particles = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (text) {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 140px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < imageData.height; y += 5) {
      for (let x = 0; x < imageData.width; x += 5) {
        const i = (y * imageData.width + x) * 4 + 3;
        if (imageData.data[i] > 120) {
          particles.push(new Particle(x, y));
        }
      }
    }
  } else {
    // default sphere
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 2000; i++) {
      const angle = (i / 2000) * Math.PI * 2;
      const r = 60 + Math.random() * 140;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      particles.push(new Particle(px, py));
    }
  }
}

function animate() {
  ctx.fillStyle = 'rgba(0,0,0,0.07)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animate);
}

// Eventlər
btn.addEventListener('click', () => {
  const val = textInput.value.trim();
  createParticles(val || null);
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createParticles(textInput.value.trim() || null);
});

// Başlanğıc
createParticles(); // default sphere
animate();
initMediaPipe();
