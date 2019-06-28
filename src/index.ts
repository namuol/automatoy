import { makeSimulator } from './automatoy';

const sim = makeSimulator(
  {
    layers: [
      {
        order: [' ', '.', '~', '@'],
        traits: {
          viscocity: {
            ' ': 0,
            '.': 0,
            '~': 0.3,
            '@': 0.9,
            DEFAULT: 1,
          },
          density: {
            ' ': 0,
            '.': -0.1,
            '~': 0.4,
            '@': 0.6,
            DEFAULT: 0,
          },
        },
        // prettier-ignore
        rules: [
          // Simple transformation:
          [
            '~',
            '.',
            [0.0001]
          ],
          // Generalized falling:
          [
            // First arg is matcher
            [
              [0],
              [0],
              [0],
            ],
            // Second arg is output
            [
              [0],
              ['$S'],
              ['$C'],
            ],
            [
              'density[$C] > density[$S]'
            ]
          ],
          [
            // First arg is matcher
            [
              [0, 0],
            ],
            // Second arg is output
            [
              ['$B', '$A'],
            ],
            [
              '$A !== $B',
              'viscocity[$A] <= viscocity[$B]',
              '1 - viscocity[$B]'
            ]
          ],
        ]
      },
    ],
  },
  30,
  30
);

for (let y = 0; y < sim.layers[0].canvas.length; y += 1) {
  for (let x = 0; x < sim.layers[0].canvas[0].length; x += 1) {
    // For now I'm just mutating this
    if (Math.random() < 0.2) {
      sim.layers[0].canvas[y][x] = '~';
    } else if (Math.random() < 0.2) {
      sim.layers[0].canvas[y][x] = '@';
    }
  }
}

const render = () => {
  document.getElementById('canvas').innerHTML = sim.layers[0].canvas
    .map(row => row.join(''))
    .join('\n');
  requestAnimationFrame(render);
};

let stepMS = 1000;
let interval = setInterval(sim.step, Math.sqrt(stepMS));
document.getElementById('stepMS').value = '' + stepMS;
document.getElementById('stepMS').addEventListener('change', e => {
  stepMS = parseFloat(e.target.value);
  clearInterval(interval);
  interval = setInterval(sim.step, Math.sqrt(stepMS));
});

document.onclick = () => {
  sim.step();
};

requestAnimationFrame(render);

render();
