const canvas = document.getElementById('starMap');
const ctx = canvas.getContext('2d');
const infoCard = document.getElementById('infoCard');

const toggleNames = document.getElementById('toggleNames');
const toggleConstellations = document.getElementById('toggleConstellations');
const toggleInfo = document.getElementById('toggleInfo');
const datetimeInput = document.getElementById('datetime');

// Sample celestial database
const stars = [
  { name: 'Sirius', ra: 101.2875, dec: -16.7161, mag: -1.46, info: 'Brightest star in the night sky.' },
  { name: 'Betelgeuse', ra: 88.7929, dec: 7.4071, mag: 0.42, info: 'Red supergiant star in Orion.' },
  { name: 'Polaris', ra: 37.9543, dec: 89.2641, mag: 1.97, info: 'The North Star located close to the north celestial pole.' }
];

const constellations = [
  { name: 'Orion', lines: [['Betelgeuse', 'Sirius']] },
  { name: 'Ursa Minor', lines: [['Polaris', 'Polaris']] }
];

let panX = 0;
let panY = 0;
let scale = 1;
let isPanning = false;
let startX = 0;
let startY = 0;

const baseTime = new Date('2025-01-01T00:00:00Z');
datetimeInput.value = baseTime.toISOString().slice(0,16);

function timeOffset() {
  const selected = datetimeInput.value ? new Date(datetimeInput.value) : baseTime;
  const diffMs = selected - baseTime;
  return (diffMs / 3600000) * 15; // degrees per hour
}

function project(ra, dec) {
  const width = canvas.width;
  const height = canvas.height;
  const offset = timeOffset();
  const x = ((ra + offset) % 360) / 360 * width;
  const y = (1 - ((dec + 90) / 180)) * height;
  return { x: x * scale + panX, y: y * scale + panY };
}

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (toggleConstellations.checked) {
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)';
    ctx.lineWidth = 1;
    constellations.forEach(c => {
      c.lines.forEach(line => {
        const starA = stars.find(s => s.name === line[0]);
        const starB = stars.find(s => s.name === line[1]);
        if (starA && starB) {
          const a = project(starA.ra, starA.dec);
          const b = project(starB.ra, starB.dec);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      });
    });
  }

  stars.forEach(star => {
    const pos = project(star.ra, star.dec);
    const radius = Math.max(1, 4 - star.mag);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    if (toggleNames.checked) {
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(star.name, pos.x + 5, pos.y - 5);
    }
  });
}

draw();

canvas.addEventListener('mousedown', e => {
  isPanning = true;
  startX = e.clientX - panX;
  startY = e.clientY - panY;
});

canvas.addEventListener('mousemove', e => {
  if (isPanning) {
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    draw();
  }
});

canvas.addEventListener('mouseup', () => {
  isPanning = false;
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale *= delta;
  panX = e.clientX - (e.clientX - panX) * delta;
  panY = e.clientY - (e.clientY - panY) * delta;
  draw();
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left);
  const y = (e.clientY - rect.top);
  let selected = null;
  stars.forEach(star => {
    const pos = project(star.ra, star.dec);
    const dist = Math.hypot(pos.x - x, pos.y - y);
    if (dist < 5) {
      selected = star;
    }
  });
  if (selected && toggleInfo.checked) {
    infoCard.innerHTML = `<strong>${selected.name}</strong><br>${selected.info}`;
    infoCard.classList.remove('hidden');
  } else {
    infoCard.classList.add('hidden');
  }
});

[toggleNames, toggleConstellations, toggleInfo, datetimeInput].forEach(el => {
  el.addEventListener('change', draw);
});
