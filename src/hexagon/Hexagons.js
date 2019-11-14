/* eslint-disable camelcase,no-param-reassign */
import propper from '@wonderlandlabs/propper';
import _ from 'lodash';
import HexGrid from 'hex-grid.js';
import uuid from 'uuid/v4';
import Hexagon, { W_H_RATIO } from './Hexagon';
import {
  ODD, roffset_to_cube, roffset_from_cube, hex_round, hex_lerp, hex_distance,
  qoffset_to_cube, qoffset_from_cube,
} from './hexFn';

const SQRT_3 = Math.sqrt(3);
function pointy_hex_to_pixel(hex, size = 1) {
  const x = size * ((SQRT_3 * hex.q + SQRT_3 / 2) * hex.r);
  const y = size * (3.0 / 2) * hex.r;
  return {
    x,
    y,
  };
}

function flat_hex_to_pixel(hex, size) {
  const x = size * (3.0 / 2) * hex.q;
  const y = size * (SQRT_3 / 2 * hex.q + SQRT_3 * hex.r);
  return {
    x,
    y,
  };
}

/*
function s({ id, cube, coords }) {
  if (!cube) return `hex ${id}`;
  return `hex ${id} --- cube ${JSON.stringify(cube)} --- coords ${JSON.stringify(coords)}`;
}
*/

class Hexagons {
  constructor(scale, extent, pointy) {
    this.scale = scale;
    this.pointy = pointy;
    this.layout = pointy ? 'odd-r' : 'odd-q';
    this.grid = new HexGrid({
      width: extent,
      height: extent,
      orientation: (pointy ? 'pointy-topped' : 'flat-topped'),
      tileFactory: this,
      layout: this.layout,
    });
  }

  newTile() {
    const out = Object.assign(new Hexagon({
      x: 0,
      y: 0,
      pointy: this.pointy,
      scale: this.scale,
    }), { id: uuid() });
    return out;
  }

  getTile(i, j) {
    const tile = this.grid.getTileByCoords(i, j);
    return this.process(tile);
  }

  centerTile() {
    return this.getTile(0, 0);
  }

  process(tile) {
    if ((!tile) || tile.cube) return tile;
    const coords = this.grid.getCoordsById(tile.id);
    const { x, y } = coords;
    tile.coords = coords;
    tile.rc = {
      row: x,
      col: y,
    };
    tile.position = this.grid.getPositionById(tile.id);
    tile.cube = this.pointy ? roffset_to_cube(ODD, tile.rc) : qoffset_to_cube(ODD, tile.rc);
    const { q, r, s } = tile.cube;
    const cubeString = this.cubeString(q, r, s);
    this.cubeMap.set(cubeString, tile);
    tile.cubeString = cubeString;
    const pixel = this.pointy ? pointy_hex_to_pixel(tile.cube, this.scale)
      : flat_hex_to_pixel(tile.cube, this.scale);
    tile.x = pixel.x;
    tile.y = pixel.y;
    return tile;
  }

  getTileByCube(q, r, s) {
    const key = this.cubeString(q, r, s);
    return this.cubeMap.get(key);
  }

  cubeString(q, r, s) {
    return `${q},${r},${s}`;
  }

  distance(a, b, max) {
    if (!(a && b)) {
      throw new Error('distance value missing');
    }

    if (max) {
      const minDistance = 'qrs'.split('')
        .reduce((dist, dim) => {
          const dimDist = Math.abs(a.cube[dim] - b.cube[dim]);
          return Math.max(dimDist, dist);
        }, 0);
      if (minDistance > max) return false;
    }

    if (a.id === b.id) return 0;
    const aNeighbors = this.grid.getNeighboursById(a.id);
    if (aNeighbors.includes(b)) {
      return 1;
    }
    const bNeighbors = this.grid.getNeighboursById(b.id);
    if (_.intersection(bNeighbors, aNeighbors).length) {
      return 2;
    }

    try {
      const midPoint = hex_round(hex_lerp(a.cube, b.cube, 0.5));
      const { col, row } = this.pointy ? roffset_from_cube(ODD, midPoint, this.scale)
        : qoffset_from_cube(ODD, midPoint, this.scale);
      const hex = this.getTile(row, col);
      return this.distance(a, hex) + this.distance(b, hex);
    } catch (err) {
      console.log('error in distance:', err);
      return false;
    }
  }

  withinHex(n, center) {
    if (!center) {
      throw new Error('bad center');
    }
    const out = [];
    const iter = this.grid.getTileIterator();

    while (!iter.done) {
      const t = this.process(iter.next());
      if (!t) break;

      try {
        const dist = hex_distance(center.cube, t.cube);
        if (dist <= n) {
          out.push(t);
        }
      } catch (err) {
        console.log('withinHex: error', err);
      }
    }

    return out;
  }

  within(n, center, y) {
    if (_.isNumber(center)) {
      center = this.getTile(center, y);
    }

    if (!center) {
      throw new Error('bad center');
    }
    const out = [];
    const iter = this.grid.getTileIterator();

    while (!iter.done) {
      const t = this.process(iter.next());
      if (!t) break;

      const dist = this.distance(t, center, n + 1);
      if ((dist !== false) && (dist <= n)) {
        out.push(t);
      }
    }

    return out;
  }
}

propper(Hexagons)
  .addProp('scale', {
    type: 'number',
    defaultValue: 1,
  })
  .addProp('cubeMap', { defaultValue: () => new Map() })
  .addProp('pointy', {
    type: 'boolean',
    defaultValue: true,
  })
  .addProp('size', {
    type: 'number',
  });

export default Hexagons;
