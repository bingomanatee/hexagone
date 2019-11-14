import propper from '@wonderlandlabs/propper';
import _ from 'lodash';
import {
  Vector3, Vector2, Object3D, Triangle, Face3,
} from 'three';

Object.assign(Face3.prototype, {
  has(n) {
    return this.a === n || this.b === n || this.c === n;
  },
  toString(verts) {
    if (verts) {
      return `Face3 (${_.trim(_.invokeMap(this.vertices(verts), 'toString').join(', '))}) - center ${this.center(verts).toString()}`;
    }

    return `Face3 (${this.i})${this.points().join(',')}`;
  },
  center(verts) {
    return new Triangle(...this.vertices(verts)).getMidpoint(new Vector3());
  },
  points() {
    return [this.a, this.b, this.c];
  },
  vertices(verts) {
    return this.points().map((i) => verts[i]);
  },
});

Object.assign(Vector3.prototype, {
  toString() {
    return `Vector3 (x: ${this.x.toFixed(5)}, y: ${this.y.toFixed(3)}, z: ${this.y.toFixed(3)})`;
  },
  equals(v3, dist = 0.01) {
    return this.distanceToSquared(v3) < dist;
  },
});

const RAD2DEG = 180/Math.PI;

function toLatLon(x, y, z) {
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lng = (Math.atan2(y, x) + (Math.PI * 2)) % (Math.PI * 2);
  const latDeg = lat * RAD2DEG;
  const lngDeg = lng * RAD2DEG;
  const x2D = lng / (Math.PI * 2);
  const y2D = (lat + Math.PI / 2) / (Math.PI);

  return {
    lat, lng, point: new Vector2(x2D, y2D), latDeg, lngDeg
  };
}

export default class Perimeter {
  constructor(world, pointIndex) {
    this.world = world;
    this.pointIndex = pointIndex;
    this.computePoints();
  }

  get edges() {
    if (!this._edges) {
      this._edges = this.faces
        .filter((face) => [face.a, face.b, face.c].includes(this.pointIndex))
        .map(({ a, b, c }) => (_.difference([a, b, c], [this.pointIndex])));
    }
    return this._edges;
  }

  get _perimIndexes() {
    if (!this.__perimIndexes) {
      let edges = [...this.edges];

      let points = edges.pop();
      while (edges.length) {
        const lastPoint = _.last(points);
        const nextEdgeI = _.findIndex(edges, (edge) => edge.includes(lastPoint));
        if (nextEdgeI !== -1) {
          const nextEdge = edges[nextEdgeI];
          points = _.uniq([...points, ...nextEdge]);
          edges = _.difference(edges, [nextEdge]);
        } else {
          break;
        }
      }
      this.__perimIndexes = points
        .map((p, i) => [this.point, this.vertices[p], this.vertices[points[(i + 1) % points.length]]]);
    }
    return this.__perimIndexes;
  }

  get adjacentFaces() {
    if (!this._af) {
      this._af = this.faces
        .filter((face) => (face.a === this.pointIndex) || (face.b === this.pointIndex) || (face.c === this.pointIndex));
    }
    return this._af;
  }

  get orderedFaces() {
    let af = [...this.adjacentFaces];
    let faces = [af.pop()];
    while (af.length > 1) {
      // eslint-disable-next-line no-loop-func
      const nextFace = _.find(af, (face) => {
        const last = _.last(faces);
        const count = _.uniq(face.points().concat(last.points())).length;
        return count === 4;
      });
      if (nextFace) {
        faces.push(nextFace);
        af = _.difference(af, [nextFace]);
      } else {
        break;
      }
    }
    faces = [...faces, ...af];

    return faces;
  }

  facePoints({ a, b, c }) {
    return [a, b, c].map((v) => this.vertices[v]);
  }

  computePoints() {
    const faces = this.orderedFaces;
    this.points = faces.map((face) => {
      const triangle = new Triangle(...this.facePoints(face));
      return triangle.getMidpoint(new Vector3());
    });
  }

  get pointsLatLon() {
    return this.points.map((point) => {
      const { x, y, z } = point.clone().normalize();
      return toLatLon(x, y, z);
    });
  }

  get northIndex() {
    return this.points.reduce((index, point, i) => {
      if (!index) return { i, y: point.y };
      if (point.y > index.y) return { i, y: point.y };
      return index;
    }, null).i;
  }

  get heights() {
    return this._perimIndexes.map((indexes) => {
      const heights = indexes.map((index) => this.world.heights.get(index));
      return _.mean(heights);
    });
  }

  get vertices() {
    const verts = _.get(this, 'world.model.vertices', []);
    if (!this._mappedVerts) {
      verts.forEach((v, i) => {
        v.i = i;
        v.s = v.toArray()
          .map((a) => Math.round(100 * a));
      });
    }
    return [...verts];
  }

  get faces() {
    if (!this._faces) {
      this._faces = _.get(this, 'world.model.faces', []).map((f, i) => {
        f.i = i;
        return f;
      });
    }
    return this._faces;
  }

  get point() {
    return this.vertices[this.pointIndex];
  }

  get plane() {
    if (!this._plane) {
      const inner = new Object3D();
      inner.lookAt(this.point);
      inner.updateMatrix();
      const root = new Object3D();
      root.attach(inner);
      this._plane = inner;
      this._plane.updateWorldMatrix();
    }
    return this._plane;
  }

  get flatPoints() {
    return this.points.map((point) => this.plane.localToWorld(point.clone()));
  }

  get north() {
    return this.plane.worldToLocal(new Vector3(1, 0, 0));
  }
}

propper(Perimeter)
  .addProp('world')
  .addProp('pointIndex');
