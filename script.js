const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const videoElement = document.getElementById('input_video');
const statusText = document.getElementById('status');
const textInput = document.getElementById('textInput');
const btn = document.getElementById('btn');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let handCoords = { x: 0, y: 0, active: false };

class Particle {
    constructor(x, y) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = x;
        this.baseY = y;
        this.size = 2.5;
        this.color = '#ff3366';
        this.density = (Math.random() * 30) + 8;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
    update() {
        let dx = handCoords.x - this.x;
        let dy = handCoords.y - this.y;
        let distance = Math.hypot(dx, dy);
        
        if (distance < 130 && handCoords.active) {
            let force = (130 - distance) / 130;
            let forceX = dx / distance * force * this.density;
            let forceY = dy / distance * force * this.density;
            this.x -= forceX;
            this.y -= forceY;
        } else {
            this.x += (this.baseX - this.x) * 0.08;
            this.y += (this.baseY - this.y) * 0.08;
        }
    }
}

// MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults((results) => {
    if (results.multiHandLandmarks?.length > 0) {
        const lm = results.multiHandLandmarks[0][8]; // şəhadət barmağı ucu
        handCoords.x = (1 - lm.x) * canvas.width;   // mirror effekti
        handCoords.y = lm.y * canvas.height;
        handCoords.active = true;
        statusText.textContent = "Əl tapıldı ✓";
        statusText.style.color = "#0f0";
    } else {
        handCoords.active = false;
        statusText.textContent = "Əl axtarılır...";
        statusText.style.color = "#f66";
    }
});

// Kamera başlatma (manual + stabil)
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            }
        });
        videoElement.srcObject = stream;
        await videoElement.play();
        console.log("Kamera aktiv");
        statusText.textContent = "Kamera aktiv ✓";
        statusText.style.color = "#0f0";
        sendFrame(); // frame göndərməyə başla
    } catch (err) {
        console.error("Kamera xətası:", err);
        statusText.textContent = "Kamera açılmadı! İcazə verin.";
        statusText.style.color = "#f44";
    }
}

function sendFrame() {
    if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
        hands.send({ image: videoElement });
    }
    requestAnimationFrame(sendFrame);
}

function createText(text) {
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 120px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const step = 4;
    for (let y = 0; y < imageData.height; y += step) {
        for (let x = 0; x < imageData.width; x += step) {
            const i = (y * imageData.width + x) * 4;
            if (imageData.data[i + 3] > 100) {
                particles.push(new Particle(x, y));
            }
        }
    }
}

function initSphere() {
    particles = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const count = 1800;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = 80 + Math.random() * 100;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        particles.push(new Particle(x, y));
    }
}

function animate() {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
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
    if (val) createText(val);
    else initSphere();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSphere();
});

// Başlanğıc
initSphere();
animate();
startCamera();
