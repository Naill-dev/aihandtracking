const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const videoElement = document.getElementById('input_video');
const statusText = document.getElementById('status');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let handCoords = { x: 0, y: 0, active: false };

// Particle Klası
class Particle {
    constructor(x, y) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = x;
        this.baseY = y;
        this.size = 2;
        this.color = '#ff0000';
        this.density = (Math.random() * 30) + 2;
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
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = 100;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < maxDistance && handCoords.active) {
            this.x -= directionX;
            this.y -= directionY;
        } else {
            if (this.x !== this.baseX) {
                this.x -= (this.x - this.baseX) / 10;
            }
            if (this.y !== this.baseY) {
                this.y -= (this.y - this.baseY) / 10;
            }
        }
    }
}

// MediaPipe Hands Ayarları
const hands = new Hands({
    locateFile: (file) => https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmark = results.multiHandLandmarks[0][8]; // 8 - Şəhadət barmağının ucu
        handCoords.x = (1 - landmark.x) * canvas.width; // Güzgü effekti üçün (1 - x)
        handCoords.y = landmark.y * canvas.height;
        handCoords.active = true;
        statusText.innerText = "Əl tapıldı ✅";
        statusText.style.color = "#00ff00";
    } else {
        handCoords.active = false;
        statusText.innerText = "Əl axtarılır...";
        statusText.style.color = "#ff0000";
    }
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();

// Mətn Yaradılması
function createText(text) {
    particles = [];
    ctx.fillStyle = 'white';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < data.height; y += 4) {
        for (let x = 0; x < data.width; x += 4) {
            if (data.data[(y * 4 * data.width) + (x * 4) + 3] > 128) {
                particles.push(new Particle(x, y));
            }
        }
    }
}

function initSphere() {
    particles = [];
    for(let i=0; i<1500; i++) {
        let angle = Math.random() * Math.PI * 2;
        let r = Math.random() * 120;
        let x = canvas.width/2 + Math.cos(angle) * r;
        let y = canvas.height/2 + Math.sin(angle) * r;
        particles.push(new Particle(x, y));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.draw();
        p.update();
    });
    requestAnimationFrame(animate);
}

initSphere();
animate();

document.getElementById('btn').onclick = () => {
    const txt = document.getElementById('textInput').value;
    if(txt) createText(txt); else initSphere();
};
