const canvas = document.querySelector("#surface");
const context = canvas?.getContext("2d");

if (context) {
  const controls = document.querySelector("#scene-controls");
  const rotate = document.querySelector("#rotate");
  const gridButtons = [...controls.querySelectorAll("[data-grid]")];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const { width, height } = canvas;
  let yaw = -0.68;
  let pitch = 0.69;
  let density = 31;
  let pointer;
  let frame;
  let lastTime;

  function project(x, y, z) {
    const horizontal = Math.cos(yaw) * x - Math.sin(yaw) * z;
    const turned = Math.sin(yaw) * x + Math.cos(yaw) * z;
    const depth = Math.cos(pitch) * turned + Math.sin(pitch) * y;
    const vertical = Math.cos(pitch) * y - Math.sin(pitch) * turned;
    const scale = 1110 / (7.9 - depth);
    return { x: width / 2 + horizontal * scale, y: height * .52 - vertical * scale, depth };
  }

  function heightAt(x, z) {
    const ridge = 1.46 * Math.exp(-.53 * ((x + .54) ** 2 + (z - .15) ** 2));
    const crest = .98 * Math.exp(-1.18 * ((x - 1.3) ** 2 + (z + .8) ** 2));
    const ripple = .28 * Math.sin(x * 2.15 - z * .7) * Math.cos(z * 1.45);
    return ridge + crest + ripple - .58;
  }

  function path(points, closed = false) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    if (closed) context.closePath();
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#63426928";
    for (let x = 24; x < width; x += 31) {
      for (let y = 24; y < height; y += 31) context.fillRect(x, y, 2, 2);
    }

    const extent = 2.45;
    context.strokeStyle = "#6b507554";
    context.lineWidth = 1.4;
    for (let index = 0; index <= 12; index += 1) {
      const step = -extent + index * extent / 6;
      path([project(step, -1.08, -extent), project(step, -1.08, extent)]);
      context.stroke();
      path([project(-extent, -1.08, step), project(extent, -1.08, step)]);
      context.stroke();
    }
    for (const x of [-extent, extent]) {
      for (const z of [-extent, extent]) {
        path([project(x, -1.08, z), project(x, heightAt(x, z), z)]);
        context.stroke();
      }
    }

    const cells = [];
    const vertices = Array.from({ length: density + 1 }, (_, row) =>
      Array.from({ length: density + 1 }, (_, col) => {
        const x = extent * (2 * col / density - 1);
        const z = extent * (2 * row / density - 1);
        const elevation = heightAt(x, z);
        return { ...project(x, elevation, z), elevation };
      })
    );
    for (let row = 0; row < density; row += 1) {
      for (let col = 0; col < density; col += 1) {
        const corners = [vertices[row][col], vertices[row][col + 1],
          vertices[row + 1][col + 1], vertices[row + 1][col]];
        const depth = (corners[0].depth + corners[2].depth) / 2;
        const elevation = (corners[0].elevation + corners[2].elevation) / 2;
        cells.push({ corners, depth, elevation });
      }
    }

    cells.sort((near, far) => near.depth - far.depth);
    context.lineWidth = density > 20 ? 1 : 1.6;
    for (const cell of cells) {
      const amount = Math.min(1, Math.max(0, (cell.elevation + .75) / 1.95));
      const hue = (265 + 119 * amount) % 360;
      path(cell.corners, true);
      context.fillStyle = `hsl(${hue} 64% ${31 + 37 * amount}%)`;
      context.strokeStyle = `hsl(${hue} 78% ${68 + 22 * amount}% / .78)`;
      context.fill();
      context.stroke();
    }
  }

  function animate(time) {
    if (lastTime !== undefined) yaw += Math.min(time - lastTime, 45) * .00043;
    lastTime = time;
    draw();
    frame = requestAnimationFrame(animate);
  }

  function setRotation(active) {
    cancelAnimationFrame(frame);
    lastTime = undefined;
    rotate.setAttribute("aria-pressed", String(active));
    if (active) frame = requestAnimationFrame(animate);
  }

  for (const button of gridButtons) {
    button.addEventListener("click", () => {
      density = button.dataset.grid === "fine" ? 31 : 12;
      for (const option of gridButtons) option.setAttribute("aria-pressed", String(option === button));
      draw();
    });
  }
  rotate.addEventListener("click", () => setRotation(rotate.getAttribute("aria-pressed") !== "true"));
  reducedMotion.addEventListener("change", event => {
    if (event.matches) setRotation(false);
  });

  canvas.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.button > 0) return;
    setRotation(false);
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", event => {
    if (pointer?.id !== event.pointerId) return;
    yaw += (event.clientX - pointer.x) * .014;
    pitch = Math.min(1.35, Math.max(.22, pitch + (event.clientY - pointer.y) * .011));
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    draw();
  });
  canvas.addEventListener("lostpointercapture", () => { pointer = undefined; });

  const turns = { ArrowLeft: [-.16, 0], ArrowRight: [.16, 0], ArrowUp: [0, -.12], ArrowDown: [0, .12] };
  canvas.addEventListener("keydown", event => {
    const turn = turns[event.key];
    if (!turn) return;
    event.preventDefault();
    setRotation(false);
    yaw += turn[0];
    pitch = Math.min(1.35, Math.max(.22, pitch + turn[1]));
    draw();
  });
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", "Three-dimensional sampled surface. Use arrow keys to turn it.");
  canvas.dataset.ready = "";
  document.querySelector("#scene-hint").hidden = false;
  controls.hidden = false;
  draw();
}
const controls = document.querySelector(".console-controls");
const examples = {
  error: { code: "sum += n * n", status: "Compilation failed", output: "Line 5: ';' expected" },
  fixed: { code: "sum += n * n;", status: "Run completed", output: "Sum of squares (1 to 5): 55" },
};
const exampleStatus = document.querySelector("#example-status");
const exampleCode = document.querySelector("#example-code");
const exampleOutput = document.querySelector("#example-output");

for (const button of controls.querySelectorAll("button")) {
  button.addEventListener("click", () => {
    const selected = button.dataset.example;
    const example = examples[selected];
    for (const option of controls.querySelectorAll("button")) {
      option.setAttribute("aria-pressed", String(option === button));
    }
    exampleCode.textContent = example.code;
    exampleStatus.textContent = example.status;
    exampleStatus.classList.toggle("success", selected === "fixed");
    exampleOutput.textContent = example.output;
  });
}
controls.hidden = false;
