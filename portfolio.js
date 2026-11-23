const surface = document.querySelector("#surface");
const context = surface.getContext("2d");

if (context) {
  const { width, height } = surface;
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#111a37");
  background.addColorStop(1, "#202f62");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#93aaff34";
  for (let x = 35; x < width; x += 30) {
    for (let y = 35; y < height; y += 30) {
      context.fillRect(x, y, 2, 2);
    }
  }

  const point = (u, v, offset) => {
    const peak = 1.55 * Math.exp(-0.55 * ((u + 0.6) ** 2 + (v - 0.3) ** 2));
    const ripple = 0.22 * Math.sin(2 * u + v) * Math.cos(v * 1.9);
    return [
      width / 2 + (u - v) * 85,
      height * 0.49 + (u + v) * 33 - (peak + ripple) * 138 + offset,
    ];
  };

  const samples = 34;
  const gridLine = (constant, alongU, offset) => {
    context.beginPath();
    for (let index = 0; index <= samples; index += 1) {
      const variable = -2.38 + index * 4.76 / samples;
      const [x, y] = alongU ? point(variable, constant, offset) : point(constant, variable, offset);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  };

  const layers = [
    { offset: 169, tint: "#6884f355", lines: 13 },
    { offset: 114, tint: "#7c9bff70", lines: 15 },
    { offset: 54, tint: "#aacaff", lines: 20 },
  ];
  for (const layer of layers) {
    context.strokeStyle = layer.tint;
    context.lineWidth = layer.offset === 54 ? 1.65 : 1.25;
    for (let index = 0; index <= layer.lines; index += 1) {
      const coordinate = -2.38 + index * 4.76 / layer.lines;
      gridLine(coordinate, true, layer.offset);
      gridLine(coordinate, false, layer.offset);
    }
  }
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
