import propper from '@wonderlandlabs/propper';
import { Vector2, Box2 } from 'three';
import _ from 'lodash';
import Extent from './Extent';

export const W_H_RATIO = Math.sin(Math.PI / 3);
export const rad60 = Math.PI / 3;
export const rad30 = Math.PI / 6;

class Hexagon {
  constructor({
    x, y, pointy, scale,
  }) {
    this.x = x;
    this.y = y;
    this.scale = scale || 1;
    this.pointy = !!pointy;
  }

  get points() {
    return (this.pointy ? unitPointyHex : unitHex)
      .map((p) => p.clone()
        .multiplyScalar(this.scale)
        .add(new Vector2(this.x, this.y)));
  }

  get pointsR() {
    return this.points.map((p) => p.round());
  }

  get width() {
    return this.scale * 2 * (this.pointy ? W_H_RATIO : 1);
  }

  get height() {
    return this.scale * 2 * (!this.pointy ? W_H_RATIO : 1);
  }
}

Hexagon.inBox = (right, top, pointy = true, left = 0, bottom = 0) => {
  console.log('hexagon in box: ', right, top, '/', left, bottom);
  const platonicBox = new Extent(pointy ? unitPointyHex : unitHex);
  const box = new Box2(new Vector2(left, bottom), new Vector2(right, top));
  console.log('into box:', box);
  const targetBox = platonicBox.fitToBox(box);
  const { x, y } = targetBox.center;
  const scale = targetBox.list.reduce((diam, pt) => {
    const newDiam = pt.distanceTo(targetBox.list[0]);
    return Math.max(newDiam, diam);
  }, 0) / 2;
  return new Hexagon({
    x, y, pointy, scale,
  });
};

Hexagon.fromPoints = (points, box) => {
  // work in progress
  const e = new Extent(points);
  const e2 = e.fitToBox(box);
  const pointy = e2.dim('x').range < e2.dim('y').range;
  const x = e2.dim('x').mid;
  const y = e2.dim('y').mid;
  const scale = e2.dim('x').range;

  return new Hexagon({
    x, y, scale, pointy,
  });
};

const unitPointyHex = _.range(0, 6)
  .map((a) => new Vector2(
    Math.cos(rad30 + a * rad60),
    Math.sin(rad30 + a * rad60),
  ));
const unitHex = _.range(0, 6)
  .map((a) => new Vector2(
    Math.cos(a * rad60),
    Math.sin(a * rad60),
  ));

propper(Hexagon)
  .addProp('x', {
    type: 'number',
    defaultValue: 0,
  })
  .addProp('y', {
    type: 'number',
    defaultValue: 0,
  })
  .addProp('scale', {
    type: 'number',
    defaultValue: 1,
  })
  .addProp('elevation', {
    type: 'number',
  })
  .addProp('cardinal', {
    type: 'boolean',
    defaultValue: false,
  })
  .addProp('pointy', {
    type: 'boolean',
    defaultValue: true,
  })
  .addProp('grid');


export default Hexagon;
