// Low-poly facet painter.
// Every canvas.facets on the page gets a jittered triangle mesh with random heights,
// flat-shaded against one light. Colors come from the CSS tokens named in
// data-stops, so the palette stays in the stylesheet.
//
//   data-stops    space-separated token names, e.g. "--teal --blue --coral"
//   data-cell     mesh cell size in CSS pixels
//   data-shade    how strongly the light varies facet brightness (0 to 1)
//   data-seed     fixed seed, so shapes stay the same across reloads and resizes
//   data-ridge    cut a mountain line across the top
//   data-animate  slowly swing the light (skipped for reduced motion)
(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seededRandom(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexToRgb(hex) {
    var value = parseInt(hex.trim().replace('#', ''), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function colorAt(stops, t) {
    var scaled = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    var index = Math.min(Math.floor(scaled), stops.length - 2);
    var mix = scaled - index;
    var from = stops[index];
    var to = stops[index + 1];
    return [0, 1, 2].map(function (channel) {
      return from[channel] + (to[channel] - from[channel]) * mix;
    });
  }

  function buildMesh(width, height, cell, random) {
    var cols = Math.ceil(width / cell);
    var rows = Math.ceil(height / cell);
    var grid = [];
    for (var r = 0; r <= rows; r++) {
      var row = [];
      for (var c = 0; c <= cols; c++) {
        // Border points stay on the grid so the mesh always covers the canvas.
        var inner = c > 0 && c < cols && r > 0 && r < rows;
        row.push({
          x: c * cell + (inner ? (random() - 0.5) * cell * 0.7 : 0),
          y: r * cell + (inner ? (random() - 0.5) * cell * 0.7 : 0),
          z: random() * cell * 0.8
        });
      }
      grid.push(row);
    }

    var triangles = [];
    for (var gr = 0; gr < rows; gr++) {
      for (var gc = 0; gc < cols; gc++) {
        var a = grid[gr][gc], b = grid[gr][gc + 1];
        var d = grid[gr + 1][gc], e = grid[gr + 1][gc + 1];
        if ((gr + gc) % 2 === 0) {
          triangles.push([a, b, e], [a, e, d]);
        } else {
          triangles.push([a, b, d], [b, e, d]);
        }
      }
    }
    return triangles;
  }

  function buildRidge(width, height, cell, random) {
    var points = [];
    var step = cell * 1.6;
    for (var i = 0, x = 0; x <= width + step; i++, x += step) {
      var peak = i % 2 === 1;
      var y = height * (peak ? 0.06 + random() * 0.28 : 0.38 + random() * 0.3);
      points.push({ x: x + (random() - 0.5) * step * 0.4, y: y });
    }
    return points;
  }

  function lightFacing(triangle, light) {
    var a = triangle[0], b = triangle[1], c = triangle[2];
    var ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z;
    var vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
    var nx = uy * vz - uz * vy;
    var ny = uz * vx - ux * vz;
    var nz = ux * vy - uy * vx;
    var length = Math.hypot(nx, ny, nz) || 1;
    var sign = nz < 0 ? -1 : 1;
    return sign * (nx * light[0] + ny * light[1] + nz * light[2]) / length;
  }

  function paint(state, time) {
    var ctx = state.ctx;
    ctx.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, state.width, state.height);

    var angle = -2.3 + (time ? Math.sin(time * 0.00035) * 0.9 : 0);
    var light = [Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0.78];
    var lightLength = Math.hypot(light[0], light[1], light[2]);
    light = light.map(function (v) { return v / lightLength; });

    state.triangles.forEach(function (triangle) {
      var cx = (triangle[0].x + triangle[1].x + triangle[2].x) / 3;
      var cy = (triangle[0].y + triangle[1].y + triangle[2].y) / 3;
      var base = colorAt(state.stops, (cx / state.width) * 0.75 + (cy / state.height) * 0.25);
      var brightness = 1 + state.shade * (lightFacing(triangle, light) - 0.8) * 2.5;
      var rgb = base.map(function (v) { return Math.round(Math.max(0, Math.min(255, v * brightness))); });
      var fill = 'rgb(' + rgb.join(',') + ')';

      ctx.beginPath();
      ctx.moveTo(triangle[0].x, triangle[0].y);
      ctx.lineTo(triangle[1].x, triangle[1].y);
      ctx.lineTo(triangle[2].x, triangle[2].y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      // A hairline in the same color hides the seams between neighbouring facets.
      ctx.strokeStyle = fill;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    if (state.ridge) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.moveTo(0, state.height);
      state.ridge.forEach(function (point) { ctx.lineTo(point.x, point.y); });
      ctx.lineTo(state.width, state.height);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function resolveStops(canvas) {
    var styles = getComputedStyle(canvas);
    return canvas.dataset.stops.split(/\s+/).map(function (token) {
      return hexToRgb(styles.getPropertyValue(token));
    });
  }

  function mountFacets(canvas) {
    var state = {
      ctx: canvas.getContext('2d'),
      cell: Number(canvas.dataset.cell),
      shade: Number(canvas.dataset.shade),
      seed: Number(canvas.dataset.seed),
      stops: resolveStops(canvas),
      width: 0,
      height: 0,
      pixelRatio: 1,
      triangles: [],
      ridge: null,
      time: 0
    };

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      state.width = rect.width;
      state.height = rect.height;
      state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * state.pixelRatio);
      canvas.height = Math.round(rect.height * state.pixelRatio);

      var random = seededRandom(state.seed);
      state.triangles = buildMesh(state.width, state.height, state.cell, random);
      state.ridge = 'ridge' in canvas.dataset ? buildRidge(state.width, state.height, state.cell, random) : null;
      paint(state, state.time);
    }

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    // Some palettes differ between light and dark themes.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      state.stops = resolveStops(canvas);
      paint(state, state.time);
    });

    if (!('animate' in canvas.dataset) || reducedMotion) return;

    var visible = true;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }).observe(canvas);
    }
    requestAnimationFrame(function frame(now) {
      if (visible && state.width) {
        state.time = now;
        paint(state, now);
      }
      requestAnimationFrame(frame);
    });
  }

  document.querySelectorAll('canvas.facets').forEach(mountFacets);
})();
