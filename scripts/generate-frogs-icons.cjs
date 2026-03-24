const fs = require("fs");
const path = require("path");

const { encode } = require(path.join(
  __dirname,
  "..",
  "angular",
  "node_modules",
  "fast-png",
));

const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "angular",
  "src",
  "assets",
  "icons",
);

const PALETTE = {
  black: [0, 0, 0, 1],
  darkGreen: [0, 96, 54, 1],
  green: [42, 164, 84, 1],
  greenHighlight: [78, 191, 104, 0.42],
  jawBase: [171, 182, 208, 1],
  jawLight: [204, 214, 236, 1],
  jawShade: [139, 150, 180, 0.58],
  white: [255, 255, 255, 1],
};

function rotatePoint(x, y, cx, cy, degrees) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = x - cx;
  const dy = y - cy;

  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
}

function inEllipse(x, y, cx, cy, rx, ry, rotation = 0) {
  const point = rotatePoint(x, y, cx, cy, rotation);
  return (point.x * point.x) / (rx * rx) + (point.y * point.y) / (ry * ry) <= 1;
}

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  const t = Math.max(
    0,
    Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared),
  );

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.hypot(x - projX, y - projY);
}

function inPolyline(x, y, points, thickness) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];

    if (distanceToSegment(x, y, x1, y1, x2, y2) <= thickness / 2) {
      return true;
    }
  }

  return false;
}

function blend(base, top) {
  const alpha = top[3];
  const inverse = 1 - alpha;

  return [
    base[0] * inverse + top[0] * alpha,
    base[1] * inverse + top[1] * alpha,
    base[2] * inverse + top[2] * alpha,
    1,
  ];
}

function createShapeSet(size, scale) {
  const s = size / 512;
  const scaled = (value) => value * s * scale;

  const headOuter = [
    { kind: "ellipse", args: [170, 168, 98, 42, -33] },
    { kind: "ellipse", args: [342, 168, 98, 42, 33] },
    { kind: "ellipse", args: [256, 192, 134, 84, 0] },
    { kind: "ellipse", args: [166, 248, 106, 80, 0] },
    { kind: "ellipse", args: [346, 248, 106, 80, 0] },
    { kind: "ellipse", args: [256, 228, 70, 88, 0] },
  ].map((shape) => ({
    kind: shape.kind,
    args: shape.args.map((value, index) => (index < 4 ? scaled(value) : value)),
  }));

  const headInner = [
    { kind: "ellipse", args: [170, 174, 86, 35, -33] },
    { kind: "ellipse", args: [342, 174, 86, 35, 33] },
    { kind: "ellipse", args: [256, 202, 122, 74, 0] },
    { kind: "ellipse", args: [170, 252, 96, 72, 0] },
    { kind: "ellipse", args: [342, 252, 96, 72, 0] },
    { kind: "ellipse", args: [256, 234, 58, 78, 0] },
  ].map((shape) => ({
    kind: shape.kind,
    args: shape.args.map((value, index) => (index < 4 ? scaled(value) : value)),
  }));

  return { headOuter, headInner, scaled };
}

function inShapeSet(x, y, shapeSet) {
  return shapeSet.some(
    (shape) =>
      shape.kind === "ellipse" &&
      inEllipse(x, y, shape.args[0], shape.args[1], shape.args[2], shape.args[3], shape.args[4]),
  );
}

function colorAt(x, y, size) {
  const color = [...PALETTE.black];
  const { headOuter, headInner, scaled } = createShapeSet(size, 1);

  let current = color;
  const paint = (condition, fill) => {
    if (condition) {
      current = blend(current, fill);
    }
  };

  paint(inEllipse(x, y, scaled(256), scaled(320), scaled(146), scaled(78)), PALETTE.jawBase);
  paint(inEllipse(x, y, scaled(256), scaled(312), scaled(132), scaled(62)), PALETTE.jawLight);
  paint(inEllipse(x, y, scaled(228), scaled(312), scaled(116), scaled(48)), PALETTE.jawShade);
  paint(inEllipse(x, y, scaled(286), scaled(294), scaled(62), scaled(20), 8), [255, 255, 255, 0.2]);

  paint(inShapeSet(x, y, headOuter), PALETTE.darkGreen);
  paint(inShapeSet(x, y, headInner), PALETTE.green);
  paint(inEllipse(x, y, scaled(152), scaled(252), scaled(54), scaled(42), -10), PALETTE.greenHighlight);
  paint(inEllipse(x, y, scaled(360), scaled(252), scaled(54), scaled(42), 10), PALETTE.greenHighlight);
  paint(inEllipse(x, y, scaled(256), scaled(216), scaled(52), scaled(42)), [255, 255, 255, 0.08]);

  paint(inEllipse(x, y, scaled(196), scaled(206), scaled(40), scaled(28), -10), PALETTE.white);
  paint(inEllipse(x, y, scaled(316), scaled(206), scaled(40), scaled(28), 10), PALETTE.white);
  paint(inEllipse(x, y, scaled(196), scaled(190), scaled(46), scaled(18), -10), PALETTE.black);
  paint(inEllipse(x, y, scaled(316), scaled(190), scaled(46), scaled(18), 10), PALETTE.black);
  paint(inEllipse(x, y, scaled(208), scaled(212), scaled(18), scaled(18)), PALETTE.black);
  paint(inEllipse(x, y, scaled(304), scaled(212), scaled(18), scaled(18)), PALETTE.black);
  paint(inEllipse(x, y, scaled(192), scaled(210), scaled(6), scaled(6)), PALETTE.white);
  paint(inEllipse(x, y, scaled(320), scaled(210), scaled(6), scaled(6)), PALETTE.white);

  paint(inEllipse(x, y, scaled(232), scaled(252), scaled(7), scaled(4), 18), PALETTE.black);
  paint(inEllipse(x, y, scaled(280), scaled(252), scaled(7), scaled(4), -18), PALETTE.black);
  paint(
    inPolyline(
      x,
      y,
      [
        [scaled(230), scaled(246)],
        [scaled(246), scaled(242)],
        [scaled(262), scaled(243)],
        [scaled(278), scaled(246)],
      ],
      scaled(6),
    ),
    PALETTE.black,
  );

  paint(
    inPolyline(
      x,
      y,
      [
        [scaled(214), scaled(325)],
        [scaled(252), scaled(316)],
        [scaled(294), scaled(323)],
        [scaled(334), scaled(344)],
      ],
      scaled(8),
    ),
    PALETTE.black,
  );

  [
    [
      [scaled(259), scaled(298)],
      [scaled(260), scaled(332)],
    ],
    [
      [scaled(279), scaled(304)],
      [scaled(280), scaled(334)],
    ],
    [
      [scaled(299), scaled(314)],
      [scaled(298), scaled(338)],
    ],
  ].forEach((points) => {
    paint(inPolyline(x, y, points, scaled(6)), PALETTE.black);
  });

  return current;
}

function renderIcon(size) {
  const data = new Uint8Array(size * size * 4);
  const samples = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const blended = [0, 0, 0, 1];

      for (const [sx, sy] of samples) {
        const sample = colorAt(x + sx, y + sy, size);
        blended[0] += sample[0];
        blended[1] += sample[1];
        blended[2] += sample[2];
      }

      const offset = (y * size + x) * 4;
      data[offset] = Math.round(blended[0] / samples.length);
      data[offset + 1] = Math.round(blended[1] / samples.length);
      data[offset + 2] = Math.round(blended[2] / samples.length);
      data[offset + 3] = 255;
    }
  }

  return Buffer.from(
    encode({
      width: size,
      height: size,
      data,
    }),
  );
}

function writeIcon(size, filename) {
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), renderIcon(size));
  console.log(`Generated ${filename}`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

writeIcon(32, "favicon-32x32.png");
writeIcon(180, "apple-touch-icon-180x180.png");
writeIcon(192, "icon-192x192.png");
writeIcon(512, "icon-512x512.png");
