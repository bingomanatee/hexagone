import propper from '@wonderlandlabs/propper';
import _ from 'lodash';

class PolyPoint {
  constructor(polygon, x, y, faceIndex, pointIndex) {
    this.x = x;
    this.y = y;
    this.polygon = polygon;
    this.faceIndex = faceIndex;
    this.pointIndex = pointIndex;
    polygon.points.add(this);
  }

  distanceTo({ x, y }) {
    return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
  }

  connect(p, noBack) {
    this.edges.add(p);
    if (!noBack) {
      p.connect(this, true);
    }
  }

  isEqual(pt) {
    if (this === pt) {
      return true;
    }
    if (Math.abs(pt.x - this.x) > 0.001) {
      return false;
    }
    if (Math.abs(pt.y - this.y) > 0.001) {
      return false;
    }
    return true;
  }

  edgeThatIsNotIn(points) {
    return _.difference(Array.from(this.edges), points)[0];
  }
}

propper(PolyPoint)
  .addProp('edges', {
    defaultValue: () => new Set(),
  })
  .addProp('x', { type: 'number', defaultValue: 0 })
  .addProp('y', { type: 'number', defaultValue: 0 })
  .addProp('faceIndex')
  .addProp('pointIndex')
  .addProp('polygon');

export default class Polygon {
  constructor(edges) {
    if (!Array.isArray(edges)) {
      console.log('non array: ', edges);
      throw new Error('bad poly edges:', edges);
    }
    edges.forEach((edge) => {
      if (!Array.isArray(edge)) {
        console.log('bad edge in ', edges, edge);
        throw new Error('bad edge');
      }
      const [p1, p2] = edge;
      const myP1 = this.addPoint(p1);
      const myP2 = this.addPoint(p2);
      myP1.connect(myP2);
    });
  }

  get perimiter() {
    const loop = this.loop();
    if (loop.length < 2) return 0;
    const first = _.first(loop);
    const last = _.last(loop);
    let distance = first.distanceTo(last);
    const current = first;
    let next = loop.shift();
    while (next) {
      distance += current.distanceTo(next);
      next = loop.shift();
    }
    return distance;
  }

  addPoint({
    x, y, faceIndex, pointIndex,
  }) {
    let p = _.find(Array.from(this.points.values()), (pp) => pp.isEqual({ x, y }));
    if (!p) {
      p = new PolyPoint(this, x, y, faceIndex, pointIndex);
    }
    this.points.add(p);
    return p;
  }

  loop() {
    if (this.points.size < 3) {
      return [];
    }
    let point = this.points.values().next().value;
    const loop = [point];
    let next;
    do {
      next = point.edgeThatIsNotIn(loop);
      if (next) {
        loop.push(next);
        point = next;
      }
    } while (next);
    return loop;
  }
}

Polygon.smallestUVFace = (points) => {
  // eslint-disable-next-line no-param-reassign
  points = points.map(({ x, y }) => ({ x: x % 1, y: y % 1 }));

  const possibilities = [];

  for (let i = 0; i < points.length; ++i) {
    const pointI = points[i];
    const xOptions = [pointI.x];
    if (pointI.x === 0) {
      xOptions.push(1);
    }
    const yOptions = [pointI.y];
    if (pointI.y === 0) {
      yOptions.push(1);
    }
    const prevPoints = points.slice(0, i);
    const nextPoints = points.slice(i + 1);
    xOptions.forEach((x) => {
      yOptions.forEach((y) => {
        const variation = [...prevPoints, { x, y }, ...nextPoints];
        console.log('variation:', variation);
        possibilities.push(variation);
      });
    });
  }
  return _(possibilities)
    .map((pp) => {
      console.log('possibility: ', pp);
      const edges = pp.reduce((e, point, i) => {
        if (i === 0) {
          return e;
        }
        return [...e, [point, pp[i - 1]]];
      }, []);
      console.log('edges:', edges);
      return edges;
    }, [[_.first(points), _.last(points)]])
    .map((edges) => new Polygon(edges))
    .sortBy('perimiter')
    .first();
};

propper(Polygon)
  .addProp('points', {
    defaultValue: () => new Set(),
    type: 'array',
  });
