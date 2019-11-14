import propper from '@wonderlandlabs/propper';

export default class PerimeterPoint {
  constructor(world, index, perimeter) {
    this.world = world;
    this.pointIndex = index;
    this.perimeter = perimeter;
  }
}

propper(PerimeterPoint)
  .addProp('pointIndex', {
    type: 'integer',
    defaultValue: 0,
  })
  .addProp('world', {
    type: 'object',
  })
  .addProp('perimeter', {
    type: 'object',
  });
