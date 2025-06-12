const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationFrameId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 8 + 4,
    speedX: Math.random() * 4 - 2,
    speedY: Math.random() * 2 + 2,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`
  };
}

function startConfetti() {
  resizeCanvas();
  particles = Array.from({ length: 50 }, createParticle);
  animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.speedX;
    p.y += p.speedY;
    p.size *= 0.99;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    if (p.size < 0.5 || p.y > canvas.height) {
      const index = particles.indexOf(p);
      particles.splice(index, 1);
      particles.push(createParticle());
    }
  });
  if (particles.length > 0) {
    animationFrameId = requestAnimationFrame(animateConfetti);
  }
}

function stopConfetti() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  particles = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);

export { startConfetti, stopConfetti };
