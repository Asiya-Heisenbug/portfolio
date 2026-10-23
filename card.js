const card = document.getElementById("card");
const canvas = document.getElementById("lenticular");
const ctx = canvas.getContext("2d");
const soundtrack = document.getElementById("soundtrack");
const musicToggle = document.getElementById("music-toggle");
const musicStatus = document.getElementById("music-status");
const typedIntro = document.getElementById("typed-intro");

const introText =
  "I’m a third-year BSc Computer Science (AI) student who loves building expressive front ends and pairing them with thoughtful back ends. I explore computer vision with OpenCV, make interactive experiments in TouchDesigner, and chase creative projects just because they sound fun. This is my sassy little corner of the internet. I’m cool. The work is, too.";

const photoA = new Image();
const photoB = new Image();

photoA.src = "photo-a.jpg";
photoB.src = "photo-b.jpg";

let blurAmount = 0;
let targetBlur = 0;
let lastX = 0;
let lastY = 0;
let lastMoveTime = 0;
let hasMoved = false;

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let animationFrame = null;
let entered = false;
let typingTimer = null;

soundtrack.addEventListener("play", () => {
  musicToggle.textContent = "SOUND: ON";
  musicToggle.setAttribute("aria-pressed", "true");
  musicStatus.textContent = "";
});

soundtrack.addEventListener("pause", () => {
  musicToggle.textContent = "SOUND: OFF";
  musicToggle.setAttribute("aria-pressed", "false");
});

soundtrack.addEventListener("error", () => {
  musicStatus.textContent = "Add sexyback.mp3 beside index.html to enable the soundtrack.";
  musicToggle.textContent = "SOUND: MISSING";
  musicToggle.setAttribute("aria-pressed", "false");
});

async function playSoundtrack() {
  try {
    await soundtrack.play();
  } catch (error) {
    musicStatus.textContent = "Add sexyback.mp3 beside index.html to enable the soundtrack.";
    musicToggle.textContent = "SOUND: MISSING";
    musicToggle.setAttribute("aria-pressed", "false");
    console.warn("Could not play sexyback.mp3:", error);
  }
}

function typeIntro() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typedIntro.textContent = introText;
    return;
  }

  let index = 0;
  function typeNextCharacter() {
    typedIntro.textContent = introText.slice(0, index);
    index += 1;
    if (index <= introText.length) {
      typingTimer = window.setTimeout(typeNextCharacter, 27);
    }
  }
  typeNextCharacter();
}

function enterPortfolio() {
  if (entered) return;
  entered = true;

  card.setAttribute("aria-pressed", "true");
  card.blur();
  card.style.transform = "";
  document.body.classList.add("is-open");
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  window.setTimeout(() => {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => {
      document.documentElement.style.removeProperty("scroll-behavior");
    });
  }, 150);
  playSoundtrack();
  window.setTimeout(typeIntro, 1200);
}

card.addEventListener("click", enterPortfolio);
card.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    enterPortfolio();
  }
});

musicToggle.addEventListener("click", () => {
  if (soundtrack.paused) {
    playSoundtrack();
  } else {
    soundtrack.pause();
  }
});

function preparePhoto(image) {
  const offscreen = document.createElement("canvas");
  offscreen.width = canvas.width;
  offscreen.height = canvas.height;

  const c = offscreen.getContext("2d");

  const scale = Math.max(
    canvas.width / image.naturalWidth,
    canvas.height / image.naturalHeight
  );

  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;

  c.drawImage(image, x, y, width, height);
  return offscreen;
}

function render() {
  if (
    !photoA.complete ||
    !photoB.complete ||
    !photoA.naturalWidth ||
    !photoB.naturalWidth ||
    !canvas.width ||
    !canvas.height
  ) {
    return;
  }

  const a = preparePhoto(photoA);
  const b = preparePhoto(photoB);

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const stripWidth = 4;
  const revealWidth = Math.abs(mouseX) * w;
  const fromLeft = mouseX < 0;

  ctx.globalAlpha = 1;
  ctx.drawImage(a, 0, 0);

  for (let x = 0; x < w; x += stripWidth) {
    const currentStripWidth = Math.min(stripWidth, w - x);
    const distance = fromLeft ? x : w - x;

    const stripProgress = Math.max(
      0,
      Math.min(1, (revealWidth - distance) / 24)
    );

    if (stripProgress > 0) {
      ctx.globalAlpha = stripProgress;

      ctx.drawImage(
        b,
        x, 0, currentStripWidth, h,
        x, 0, currentStripWidth, h
      );
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = "#00000012";

  for (let x = 0; x < w; x += 3) {
    ctx.fillRect(x, 0, 1, h);
  }
}

function animate() {
  if (entered) {
    animationFrame = null;
    return;
  }

  mouseX += (targetX - mouseX) * 0.14;
  mouseY += (targetY - mouseY) * 0.14;

  if (performance.now() - lastMoveTime > 100) {
    targetBlur = 0;
  }

  blurAmount += (targetBlur - blurAmount) * 0.18;

  if (blurAmount < 0.05 && targetBlur === 0) {
    blurAmount = 0;
  }

  canvas.style.filter =
    blurAmount > 0 ? `blur(${blurAmount}px)` : "none";

  card.style.transform =
    `rotateY(${mouseX * 18}deg) rotateX(${-mouseY * 10}deg)`;

  render();

  const stillMoving =
    Math.abs(targetX - mouseX) > 0.002 ||
    Math.abs(targetY - mouseY) > 0.002;

  const blurChanging =
    Math.abs(targetBlur - blurAmount) > 0.02;

  if (stillMoving || blurChanging) {
    animationFrame = requestAnimationFrame(animate);
  } else {
    animationFrame = null;
  }
}

function movePointer(clientX, clientY) {
  const rect = card.getBoundingClientRect();

  if (!rect.width || !rect.height) return;

  targetX = Math.max(
    -1,
    Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1)
  );

  targetY = Math.max(
    -1,
    Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1)
  );

  let speed = 0;

  if (hasMoved) {
    const dx = clientX - lastX;
    const dy = clientY - lastY;
    speed = Math.sqrt(dx * dx + dy * dy);
  }

  hasMoved = true;
  targetBlur = Math.min(7, speed * 0.12);

  lastX = clientX;
  lastY = clientY;
  lastMoveTime = performance.now();

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(animate);
  }
}

card.addEventListener("pointermove", (event) => {
  movePointer(event.clientX, event.clientY);
});

card.addEventListener("pointerleave", () => {
  if (entered) return;

  targetX = 0;
  targetY = 0;
  targetBlur = 0;
  lastMoveTime = 0;
  hasMoved = false;

  if (!animationFrame) {
    animationFrame = requestAnimationFrame(animate);
  }
});

function setupCanvas() {
  const rect = card.getBoundingClientRect();

  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);

  render();
}

photoA.onload = setupCanvas;
photoB.onload = setupCanvas;

photoA.onerror = () => {
  console.error("Could not load photo-a.jpg");
};

photoB.onerror = () => {
  console.error("Could not load photo-b.jpg");
};

if ("ResizeObserver" in window) {
  new ResizeObserver(setupCanvas).observe(card);
} else {
  window.addEventListener("resize", setupCanvas);
}