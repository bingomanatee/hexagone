import _ from 'lodash';
import { Vector2, Box2 } from 'three';

export default class Extent {
  constructor(list) {
    this.list = list.map(({ x, y }) => new Vector2(x, y));
    this._d = new Map();
    this._d.set('x', _extent(this.list, 'x'));
    this._d.set('y', _extent(this.list, 'y'));
  }

  dim(d) {
    if (!this._d.has(d)) {
      this._d.set(d, _extent(this.list, d));
    }
    return this._d.get(d);
  }

  get minPt() {
    return new Vector2(this.dim('x').min, this.dim('y').min);
  }

  get maxPt() {
    return new Vector2(this.dim('x').max, this.dim('y').max);
  }

  get center() {
    return new Vector2(this.dim('x').mid, this.dim('y').mid);
  }

  get absPoints() {
    const min = this.minPt;

    return this.list.map((p) => p.clone().sub(min));
  }

  fitToBox(box) {
    const boxExtent = new Extent(box instanceof Vector2 ? [box, new Vector2()] : [box.min, box.max]);
    const offset = boxExtent.center.sub(this.center);
    const scalar = Math.min(
      boxExtent.dim('x').range / this.dim('x').range,
      boxExtent.dim('y').range / this.dim('y').range,
    );
    const newPoints = this.absPoints.map((p) => p.multiplyScalar(scalar).add(boxExtent.minPt));

    return new Extent(newPoints);
  }

  toBox2() {
    return new Box2(this.min, this.max);
  }
}


function _extent(objs, dim) {
  const values = _.map(objs, dim);
  const extent = {
    min: _.min(values),
    max: _.max(values),
  };
  extent.range = extent.max - extent.min;
  extent.mid = (extent.max + extent.min) / 2;
  return extent;
}
