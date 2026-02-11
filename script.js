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

// --- Particle (Zərrəcik) Klası ---
class Particle {
    constructor(x, y) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.baseX = x;
        this.baseY = y;
        this.size = 1.8;
        this.color = '#ff0000';
        this.density = (Math.random() * 30) + 5;
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
        
        // Əgər əl yaxındırsa, zərrəciklər qaçsın
        if (distance < 120 && handCoords.active) {
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;
            let force = (120 - distance) / 120;
            this.x -= forceDirectionX * force * this.density;
            this.y -= forceDirectionY * force * this.density;
        } else {
            // Öz yerinə qayıtsın
            if (this.x !== this.baseX) {
                this.x -= (this.x - this.baseX) / 15;
            }
            if (this.y !== this.baseY) {
                this.y -= (this.y - this.baseY) / 15;
            }
        }
    }
}

// --- MediaPipe Hands (Əl Təqibi) ---
const hands = new Hands({
    locateFile: (file) => https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmark = results.multiHandLandmarks[0][8]; // Şəhadət barmağı (Index Finger)
        // Güzgü effekti və ekran ölçüsü uyğunlaşdırılması
        handCoords.x = (1 - landmark.x) * canvas.width;
        handCoords.y = landmark.y * canvas.height;
        handCoords.active = true;
        
        statusText.innerText = "Əl tapıldı ✅";
        statusText.style.color = "#00ff00";
    } else {
        handCoords.active = false;
        statusText.innerText = "Əl axtarılır...";
        statusText.style.color = "#ff4444";
    }
});

// --- Kamera İdarəetməsi ---
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});

camera.start().then(() => {
    statusText.innerText = "Kamera aktiv!";
}).catch(() => {
    statusText.innerText = "Kamera bloklanıb!";
});

// --- Zərrəcikləri Yaradan Funksiyalar ---
function initSphere() {
    particles = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particleCount = 1300; 

    for (let i = 0; i < particleCount; i++) {
        let angle = Math.random() * Math.PI * 2;
        let r = Math.sqrt(Math.random()) * 130; // Kürənin radiusu
        let x = centerX + r * Math.cos(angle);
        let y = centerY + r * Math.sin(angle);
        particles.push(new Particle(x, y));
    }
}

function createText(text) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 110px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let newCoords = [];
    for (let y = 0; y < imageData.height; y += 4) {
        for (let x = 0; x < imageData.width; x += 4) {
            if (imageData.data[(y * 4 * imageData.width) + (x * 4) + 3] > 128) {
                newCoords.push({x: x, y: y});
            }
        }
    }

    // Mövcud zərrəcikləri yeni koordinatlara yönləndir
    for (let i = 0; i < particles.length; i++) {
        if (i < newCoords.length) {
            particles[i].baseX = newCoords[i].x;
            particles[i].baseY = newCoords[i].y;
        } else {
            // Artıq zərrəciklər mərkəzə çəkilsin
            particles[i].baseX = canvas.width / 2;
            particles[i].baseY = canvas.height / 2;
        }
    }
}

// --- Animasyon Döngüsü ---
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}

// --- Event Listeners (Hadisələr) ---
btn.onclick = () => {
    if (textInput.value.trim() !== "") {
        createText(textInput.value);
    } else {
        initSphere();
    }
};

textInput.onkeypress = (e) => {
    if (e.key === 'Enter') btn.click();
};

window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSphere();
};

// --- Başlat ---
initSphere();
animate();
