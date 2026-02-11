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

// --- Particle Klası ---
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
        
        if (distance < 100 && handCoords.active) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let force = (100 - distance) / 100;
            this.x -= forceDirectionX * force * this.density;
            this.y -= forceDirectionY * force * this.density;
        } else {
            if (this.x !== this.baseX) {
                this.x -= (this.x - this.baseX) / 15;
            }
            if (this.y !== this.baseY) {
                this.y -= (this.y - this.baseY) / 15;
            }
        }
    }
}

// --- MediaPipe Hands Setup ---
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
        // 8 nömrəli nöqtə şəhadət barmağının ucudur
        const landmark = results.multiHandLandmarks[0][8];
        handCoords.x = (1 - landmark.x) * canvas.width; // Güzgü əksi üçün
        handCoords.y = landmark.y * canvas.height;
        handCoords.active = true;
        
        statusText.innerText = "Əl tapıldı ✅";
        statusText.style.color = "#00ff00";
    } else {
        handCoords.active = false;
        statusText.innerText = "Əl axtarılır...";
        statusText.style.color = "#ff6666";
    }
});

// --- Kamera İdarəetməsi ---
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Kameranı başlat və xətaları tut
camera.start()
    .then(() => {
        console.log("Kamera uğurla açıldı");
        statusText.innerText = "Kamera aktiv. Əlini göstər.";
    })
    .catch(err => {
        console.error("Kamera xətası: ", err);
        statusText.innerText = "Kamera açılmadı! (Xəta)";
    });

// --- Funksiyalar ---
function createText(text) {
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mətni müvəqqəti çək
    ctx.fillStyle = 'white';
    ctx.font = 'bold 100px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < imageData.height; y += 4) {
        for (let x = 0; x < imageData.width; x += 4) {
            if (imageData.data[(y * 4 * imageData.width) + (x * 4) + 3] > 128) {
                particles.push(new Particle(x, y));
            }
        }
    }
}

function initSphere() {
    particles = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    for(let i=0; i < 1200; i++) {
        let angle = Math.random() * Math.PI * 2;
        let r = Math.random() * 120;
        let x = centerX + Math.cos(angle) * r;
        let y = centerY + Math.sin(angle) * r;
        particles.push(new Particle(x, y));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    requestAnimationFrame(animate);
}

// --- Event Listeners ---
btn.addEventListener('click', () => {
    if (textInput.value.trim() !== "") {
        createText(textInput.value);
    } else {
        initSphere();
    }
});

textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btn.click();
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSphere();
});

// Başlat
initSphere();
animate();
