import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

const status = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const video = document.getElementById('video');
const toggle = document.getElementById('toggle');
const clearBtn = document.getElementById('clear');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let detector = null;
let particles = [];
let effectOn = true;
const trail = 0.07;

const connections = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17]
];

class Particle {
  constructor(tx, ty) {
    this.x = canvas.width * Math.random();
    this.y = canvas.height * Math.random();
    this.tx = tx;
    this.ty = ty;
    this.size = 1.8 + Math.random() * 2.2;
    this.hue = 300 + Math.random() * 60;
    this.dens = 10 + Math.random() * 30;
  }
  update() {
    let dx = this.tx - this.x;
    let dy = this.ty - this.y;
    let d = Math.hypot(dx, dy);
    if (d > 1) {
      this.x += dx * (0.1 + this.dens/150);
      this.y += dy * (0.1 + this.dens/150);
    }
  }
  draw() {
    ctx.fillStyle = hsl(${this.hue}, 100%, 65%);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
  }
}

async function loadDetector() {
  status.textContent = "Wasm + Model yüklənir...";
  status.style.color = 'yellow';

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    status.textContent = "Vision hazır, Hand model yüklənir...";
    
    detector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    
    status.textContent = "Detector hazır ✓ Kamera açılır...";
    status.style.color = 'lime';
    startCam();
  } catch (e) {
    console.error("Yüklənmə xətası:", e);
    status.textContent = "Yüklənmə xətası: " + e.message + " (F12 konsoluna bax)";
    status.style.color = 'red';
  }
}

async function startCam() {
  status.textContent = "Kamera icazəsi + axın başlayır...";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: "user" } 
    });
    video.srcObject = stream;
    
    video.onloadedmetadata = () => {
      video.play().then(() => {
        status.textContent = "Kamera işləyir ✓ Əlini göstər";
        status.style.color = '#0f0';
        loop();
      }).catch(e => {
        status.textContent = "Play xətası: " + e.message;
        status.style.color = 'orange';
      });
    };
  } catch (e) {
    status.textContent = "Kamera xətası: " + e.message;
    status.style.color = 'orange';
  }
}

async function loop() {
  if (!detector || video.readyState < 2) {
    requestAnimationFrame(loop);
    return;
  }

  const res = await detector.detectForVideo(video, performance.now());

  ctx.fillStyle = rgba(0,0,0,${trail});
  ctx.fillRect(0,0,canvas.width,canvas.height);

  if (res.landmarks?.length > 0 && effectOn) {
    const marks = res.landmarks[0];
    const scale = p => ({ x: (1 - p.x) * canvas.width, y: p.y * canvas.height });

    if (particles.length === 0) {
      particles = marks.map(m => new Particle(scale(m).x, scale(m).y));
    } else {
      marks.forEach((m,i) => {
        const s = scale(m);
        particles[i].tx = s.x;
        particles[i].ty = s.y;
      });
    }

    connections.forEach(([i1,i2]) => {
      const a = scale(marks[i1]);
      const b = scale(marks[i2]);
      for (let k=0; k<=10; k++) {
        const t = k/10;
        const ix = a.x + t*(b.x - a.x);
        const iy = a.y + t*(b.y - a.y);
        const tmp = new Particle(ix, iy);
        tmp.size *= 0.6;
        tmp.hue = 320;
        tmp.update();
        tmp.draw();
      }
    });

    particles.forEach(p => { p.update(); p.draw(); });

    status.textContent = "Əl tapıldı ✋";
  } else {
    status.textContent = effectOn ? "Əl axtarılır..." : "Effekt söndürülüb";
  }

  requestAnimationFrame(loop);
}

toggle.onclick = () => {
  effectOn = !effectOn;
  toggle.textContent = effectOn ? "Particle Effekt (Aktiv)" : "Particle Effekt (Söndür)";
  if (!effectOn) particles = [];
};

clearBtn.onclick = () => {
  particles = [];
  ctx.clearRect(0,0,canvas.width,canvas.height);
};

window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

loadDetector();
