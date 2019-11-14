import { IcosahedronGeometry } from 'three';
import propper from '@wonderlandlabs/propper';
import t from 'table';
import _ from 'lodash';
import Svg from 'svg.js';
import colorJS from 'chroma-js';
import Perimeter from './Perimeter';
import PerimeterPoint from './PerimeterPoint';

console.log('table module: ', t);

function loopToPolyPoints(loop) {
  loop.push(_.first(loop));
  return loop.map(({ x, y }) => `${Math.round(x)},${Math.round(y)}`)
    .join(' ');
}

export default class World {
  constructor(name, resolution = 0, heights = null, id = '') {
    this.name = name;
    this.resolution = resolution;
    this.id = id;
    this.initElevations();
    this.init(heights);
    this.paint = _.throttle((n, e) => this._paint(n, e), 100);
  }

  init(heights) {
    if (heights && _.isObject(heights)) {
      Object.keys(heights)
        .forEach((key) => {
          const keyInt = Number.parseInt(key, 10);
          if (_.isNumber(keyInt)) {
            const value = Number.parseInt(heights[key], 10);
            if (_.isNumber(value)) {
              this.heights.set(keyInt, value);
            }
          }
        });
    }
  }

  _paint(n) {
    const worldPoint = this.points.get(n);
    if (worldPoint) {
      const height = this.elevationHeight;
      this.points.forEach((otherWP) => {
        if (otherWP.vertex.manhattanDistanceTo(worldPoint.vertex) < 2 * (this.radius)) {
          otherWP.addHeight(height, worldPoint.vertex, this.radius, this.opacity);
        }
      });
      this.updateHeights();
    } else {
      console.log('cannot find point ', n);
    }
  }

  updateHeights() {
    this.points.forEach((point) => {
      const { pointIndex, height } = point;
      this.heights.set(pointIndex, height);
    });
  }

  get elevationHeight() {
    const ele = this.elevations.reduce((match, candidate) => {
      if (match) {
        return match;
      }
      if (candidate.name === this.currentElevation) {
        return candidate;
      }
      return null;
    }, null);

    if (!ele) {
      console.log('cannot find ', this.currentElevation);
      return 0;
    }
    return ele.height;
  }

  initElevations() {
    this.elevations.push({
      height: 20000,
      shade: 1,
      color: [255, 255, 255],
      name: 'top',
    });
    this.elevations.push({
      height: 10000,
      shade: 1,
      color: [102, 0, 51],
      name: 'treeline',
    });
    this.elevations.push({
      height: 5000,
      shade: 0.8,
      color: [51, 102, 0],
      name: 'mountains',
    });
    this.elevations.push({
      height: 200,
      shade: 0.6,
      color: [102, 153, 0],
      name: 'hills',
    });
    this.elevations.push({
      height: 0,
      shade: 0.5,
      color: [255, 255, 0],
      name: 'coast',
    });
    this.elevations.push({
      height: -1,
      shade: 0.5,
      color: [0, 13, 255],
      name: 'sea level',
    });
    this.elevations.push({
      height: -10000,
      shade: 0,
      color: [0, 0, 0],
      name: 'bottom',
    });
  }

  drawSVG(svgRef) {
    this.svgRef = svgRef;
    this.draw2D();
  }

  eleToColor(height) {
    if (!_.isNumber(height)) {
      return '#999999';
    }
    const range = {
      prev: _.first(this.sortedElevations),
      match: null,
      next: _.last(this.sortedElevations),
    };

    try {
      if (height < range.prev.height) {
        return colorJS(...range.prev.color)
          .css();
      }
      if (height > range.next.height) {
        return colorJS(...range.next.color)
          .css();
      }
    } catch (err) {
      console.log('error -- eleToColor extremes', err);
      return '#999999';
    }

    try {
      this.elevations.forEach((ele) => {
        if (!range.match) {
          if (ele.height < range.prev.height
            || ele.height > range.next.height) {
            return;
          }
          if (ele.height < height) {
            if (ele.height > range.prev.height) {
              range.prev = ele;
            }
          } else if (ele.height === height) {
            range.match = ele;
          } else if (ele.height < range.next.height) {
            range.next = ele;
          }
        }
      });
    } catch (err) {
      console.log('error- eleToColor - iter', err);
      return '#999999';
    }

    try {
      if (range.match) {
        return colorJS(...range.match.color)
          .css();
      }
    } catch (err) {
      console.log('error- eleToColor - match', err);
      return '#999999';
    }
    try {
      const prevColor = colorJS(...range.prev.color);
      const nextColor = colorJS(...range.next.color);
      const diff = range.next.height - range.prev.height;
      const extent = height - range.prev.height;
      return colorJS.mix(prevColor, nextColor, extent / diff)
        .css();
    } catch (err) {
      console.log('error- eleToColor - mix', err);
      return '#999999';
    }
  }

  setActiveElevation(ele, e) {
    if (e) {
      e.preventDefault();
    }
    if (_.isObject(ele) && 'name' in ele) {
      this.currentElevation = ele.name;
      console.log('setting current elevation', ele);
    } else {
      console.log('cannot set ele', ele);
    }
  }

  areas() {
    const areas = [
      {
        name: 'label-head',
        start: [0, 0],
        end: [1, 0],
      },
      {
        name: 'value-head',
        start: [2, 0],
        end: [3, 0],
      },
    ];
    this.sortedElevations.forEach((e, i) => {
      areas.push({
        name: `pip-${i}`,
        start: [0, i + 1],
        end: [0, i + 1],
      });
      areas.push({
        name: `label-${i}`,
        start: [1, i + 1],
        end: [1, i + 1],
      });
      areas.push({
        name: `value-${i}`,
        start: [2, i + 1],
        end: [2, i + 1],
      });
    });
    return areas;
  }

  get sortedElevations() {
    return _.sortBy(this.elevations, 'height');
  }

  draw2D(svgRef, size) {
    if (svgRef) {
      this.svgRef = svgRef;
    }
    if (size) {
      this.size2D = size;
    }

    const svgElement = _.get(this, 'svgRef.current');

    if (!(this.size2D && svgElement)) {
      return;
    }

    const { width, height } = this.size2d;

    const perimPoints = [];
    this.perimeters.forEach((perimeter, i) => perimPoints.push(new PerimeterPoint(this, i, perimeter)));

    perimPoints.forEach((point) => {
      this.points.set(point.pointIndex, point);
      if (!this.heights.has(point.pointIndex)) {
        this.heights.set(point.pointIndex, -100);
      }
    });

    const draw = new Svg(svgElement).size(xr, yb);
    perimPoints.forEach((point) => {
      const points = point.perimeter.pointsLatLon
        .map(({ point: llPoint }) => {
          const c = llPoint.clone();
          c.x *= width;
          c.y *= height;
          return c;
        });

      point.poly = draw.polygon(loopToPolyPoints(points))
        .stroke({
          width: 1,
          color: 'black',
        })
        .attr('id', `polyForPoint-${point.pointIndex}`);
    });
  }

  toJSON() {
    const info = {
      name: this.name,
      resolution: this.resolution,
    };
    const data = {};
    this.heights.forEach((value, key) => {
      data[key] = Math.round(value);
    });

    return {
      info,
      data,
      id: this.id || '',
    };
  }

  table(echo = false) {
    const config = {
      border: getBorderCharacters('void'),
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 2,
      },
      drawHorizontalLine: () => false,
      columns:
        {
          0: {
            alignment: 'right',
            width: 10,
            truncate: 8,
          },

          1: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },

          2: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },

          3: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },

          4: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },

          5: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },

          6: {
            alignment: 'right',
            width: 10,
            truncate: 8,
          },

          7: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },

          8: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },

          9: {
            alignment: 'right',
            width: 12,
            truncate: 8,
          },
        },
    };

    const data = [
      ['vertex', 'x', 'y', 'z', 'lat', 'lon', 'face', 'a', 'b', 'c'],
    ];

    function ins(row, col, v) {
      if (!data[row + 1]) data[row + 1] = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
      data[row + 1][col] = v;
    }

    this.model.vertices.forEach((v, i) => {
      ins(i, 0, i);
      ins(i, 1, (100 * v.x).toFixed(1));
      ins(i, 2, (100 * v.y).toFixed(1));
      ins(i, 3, (100 * v.z).toFixed(1));
    });

    this.model.faces.forEach((f, i) => {
      ins(i, 4, i);
      ins(i, 5, f.a);
      ins(i, 6, f.b);
      ins(i, 7, f.c);
    });

    let output = table(data, config);

    const config2 = { ...config };

    config2.columns = {
      0: config.columns[0],
      1: config.columns[1],
      2: config.columns[1],
      3: config.columns[1],
      4: config.columns[1],
      5: config.columns[1],
      6: config.columns[1],
      7: config.columns[1],
      8: config.columns[1],
      9: config.columns[1],
      10: config.columns[1],
      11: config.columns[1],
      12: config.columns[1],
    };

    const heads = _.range(0, 6).map((i) => ([`lat ${i + 1}`, `lng ${i + 1}`]));

    const data2 = [
      _.flattenDeep(['vertex', ...heads]),
    ];

    function ins2(row, col, value) {
      row += 1;
      if (!data2[row]) data2[row] = _.range(0, data2[0].length).map(() => '  ');
      data2[row][col] = value;
    }

    this.perimeters.forEach((p, i) => {
      const toLL = p.pointsLatLon;
      ins2(i, 0, i);
      toLL.forEach((ll, index) => {
        const { latDeg, lngDeg } = ll;
        ins2(i, 1 + (index * 2), latDeg.toFixed(1));
        ins2(i, 2 + (index * 2), lngDeg.toFixed(1));
      });
    });

    output += `\n LAT LNG \n${table(data2, config2)}`;

    this.perimeters.forEach((p, i) => {
      const toLL = p.pointsLatLon;
      ins2(i, 0, i);
      toLL.forEach((ll, index) => {
        const { point } = ll;
        ins2(i, 1 + (index * 2), point.x.toFixed(5));
        ins2(i, 2 + (index * 2), point.y.toFixed(5));
      });
    });

    output += `\n latLong point2d \n${table(data2, config2)}`;
    if (echo) console.log(output);
    return output;
  }

  get perimeters() {
    if (!this._perimeters) {
      this._perimeters = new Map();
      Array.from(this.model.vertices.keys()).forEach((i) => {
        this._perimeters.set(i, new Perimeter(this, i));
      });
    }
    return this._perimeters;
  }

  get model() {
    if (!this._model) {
      this._model = new IcosahedronGeometry(1, this.resolution);
    }
    return this._model;
  }
}

propper(World)
  .addProp('svgRef')
  .addProp('id', '')
  .addProp('opacity', {
    defaultValue: 0.5,
    onChange(value) {
      console.log('opacity set to ', value);
    },
  })
  .addProp('radius', {
    defaultValue: 0.1,
  })
  .addProp('paintMode', {
    type: 'boolean',
    defaultValue: true,
  })
  .addProp('name', {
    type: 'string',
    defaultValue: '',
  })
  .addProp('points', {
    defaultValue: () => new Map(),
  })
  .addProp('heights', {
    defaultValue: () => new Map(),
  })
  .addProp('size2d', () => ({}), 'object')
  .addProp('elevations', {
    type: 'array',
    defaultValue: () => [],
  })
  .addProp('currentElevation', {
    defaultValue: 'hills',
    type: 'string',
  })
  .addProp('resolution', {
    type: 'integer',
    defaultValue: 0,
  });

/**

 draw2D_old(svgRef, size) {
    if (svgRef) {
      this.svgRef = svgRef;
    }
    if (size) {
      this.size2D = size;
    }

    const svgElement = _.get(this, 'svgRef.current');

    if (this.size2D && svgElement) {
      const xr = _.get(this, 'size2D.width', 0);
      const yb = _.get(this, 'size2D.height', 0);

      const bbox = {
        xl: 0,
        xr,
        yt: 0,
        yb,
      }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom

      const points2D = this.model.vertices.map((vertex, i) => {
        // @todo - put to worldPoint
        const { x, y, z } = vertex;
        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lng = (Math.atan2(y, x) + Math.PI) % (Math.PI * 2);
        const x2D = lng / (Math.PI * 2);
        const y2D = (lat + Math.PI / 2) / (Math.PI);
        return new WorldPoint({
          xi: x2D.toFixed(2),
          yi: y2D.toFixed(2),
          lat,
          lng,
          world: this,
          vertex,
          x: Math.round(x2D * xr),
          y: Math.round(y2D * yb),
          pointIndex: i,
        });
      });

      points2D.forEach((point) => {
        this.points.set(point.pointIndex, point);
        if (!this.heights.has(point.pointIndex)) {
          this.heights.set(point.pointIndex, -100);
        }
      });

      const diagram = new Voronoi().compute(points2D, bbox);
      const draw = new Svg(svgElement).size(xr, yb);
      diagram.cells.forEach((cell) => {
        if (_.get(cell, 'halfedges.length') > 2) {
          try {
            const worldPointIndex = cell.site.pointIndex;
            const worldPoint = this.points.get(worldPointIndex);

            const edges = _(cell.halfedges)
              .map('edge')
              .map(({ va, vb }) => [va, vb])
              .value();
            const poly = new Polygon(edges);
            const polyPoints = loopToPolyPoints(poly.loop());
            const index = cell.site.pointIndex;
            const drawnPoly = draw.polygon(polyPoints)
              .stroke({
                width: 1,
                color: 'black',
              })
              .attr({ id: `shape-for-point-${index}` });
            worldPoint.poly = drawnPoly;
          } catch (err) {
            console.log('error drawing', err);
          }
        }
      });
    }
  }
 * */
