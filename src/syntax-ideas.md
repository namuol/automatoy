Vertical rule, not mirrored:

```js

// Make `~` fall into empty space:
[*]          [*]
[~] - 1.0 -> [ ]
[ ]          [~]
```

Perhaps, when using `[ ][ ]`, implies the rule is "mirrored" since there's no
distinction between left/right of center:

```js
// Make `~` slide left or right into empty space:
[ ][~] - 1.0 -> [~][ ]

// This is (sorta?) equivalent to these two rules combined:
[ ][~][*] - 1.0 -> [~][ ][*]
[*][~][ ] - 1.0 -> [*][~][ ]
```

You can refer to the "neighborhood" of cells with special names:

```js
[$NE][$N][$NW][$E][$C][$W][$SE][$S][$SW];
```

Character-class style syntax allows negation:

```js
[^ ][ ] - 1.0 -> [ ][^ ]
```

```js
TRAIT density =
  .       0.01
  ~       0.5
  @       0.9
  DEFAULT 0.0

                                      [**]
[density[$C] > density[$S]] -> 0.5 -> [$S]
                                      [$C]
```

JSON representation

```js
{
  layers: [
    {
      order: ' .~@98765432┃│┆',
      traits: {
        density: {
          '.': 0.01,
          '~': 0.5,
          '@': 0.9,
          DEFAULT: 0,
        },
        viscocity: {
          DEFAULT: 1,
        },
      },
      rules: [
        // Simple falling:
        [
          // First arg is matcher
          [
            ['*'],
            ['*'],
            ['*'],
          ],
          // Second arg is output
          [
            ['*'],
            ['$S'],
            ['$C'],
          ],
          // Last arg is (probabilistic) conditions
          [
            // F--- it, let's just `eval`:
            '1 - viscocity[$C]',
            'density[$C] > density[$S]',
            // Or maybe just sexpr:
            ['-', 1, ['viscocity', '$C']],
            ['>', ['density', '$C'], ['density', '$S']],
          ]
        ],

        // Simple sloshing:
        [
          // First arg is matcher
          [
            ['*', '*'],
          ],
          // Second arg is output
          [
            ['$B', '$A']
          ],
          // Last arg is (probabilistic) conditions
          [
            // F--- it, let's just `eval`:
            'density[$A] > density[$B]',
            // Or maybe just sexpr:
            ['>', ['density', '$A'], ['density', '$B']],
          ]
        ],

        // Evaporation:
        [
          // First arg is matcher
          '~',
          // Second arg is output
          '.',
          // Last arg is conditions
          [
            // F--- it, let's just `eval`:
            'COUNT(" ") * 0.01',
            // Or maybe just sexpr:
            ['*', ['COUNT', ' '], 0.01],
          ]
        ],

        // Plant growth?
      ],
    }
  ],
}
```
