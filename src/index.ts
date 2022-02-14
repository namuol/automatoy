import { makeSimulator } from './automatoy';

const sim = makeSimulator(
  {
    layers: [
      {
        order: [' ', '.', '~', 'D', 'm', '!'],
        traits: {
          viscocity: {
            ' ': 0,
            '.': 0.1,
            '~': 0.3,
            m: 0.9,
            D: 0.99,
            DEFAULT: 1,
          },
          density: {
            ' ': 0,
            '.': -0.1,
            '~': 0.4,
            m: 0.5,
            D: 0.6,
            DEFAULT: 0.5,
          },
        },
        // prettier-ignore
        rules: [
          // Water evaporation:
          [
            '~',
            '.',
            ['COUNT(" ") * 0.0005']
          ],

          // Vapor condensation:
          [
            '.',
            '~',
            ['COUNT(".") * 0.0005']
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

            // Cells that are denser swap places with what's below them
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
          
          // Mud forming
          [
            'D',
            'm',
            ['COUNT("~") * 0.0001']
          ],
          
          // "Sprouting"
          [
            // First arg is matcher
            [
              [0],
              ['m'],
              ['D'],
            ],
            // Second arg is output
            [
              [0],
              ['!'],
              ['D'],
            ],

            [0.0001]
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
      sim.layers[0].canvas[y][x] = 'D';
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
