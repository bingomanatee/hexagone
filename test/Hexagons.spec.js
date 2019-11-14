const _ = require('lodash');
const tap = require('tap');
const { Hexagons } = require('../lib');

const neighborPoints = (neighbors) => _(neighbors)
  .map('coords')
  .sortBy('x', 'y')
  .value();

tap.test('Hexagons', (suite) => {
  suite.test('should create a Hexagons instance', (cnTest) => {
    const h = new Hexagons(10, 20, true);
    cnTest.ok(h.pointy);
    cnTest.end();
  });

  suite.test('should retrieve a tile', (tileTest) => {
    const h = new Hexagons(10, 20, true);
    const t = h.getTile(2, 2);
    tileTest.same(t.position, {
      x: 2,
      y: 2,
    });

    const t2 = h.getTile(3, 3);
    tileTest.same(t2.position, {
      x: 3.5,
      y: 3,
    });
    tileTest.end();
  });

  suite.test('should have the expected corners', (cornerTest) => {
    const h = new Hexagons(10, 20, true);
    const t = h.getTile(0, 0);
    cornerTest.same(t.pointsR.map(({ x, y }) => [x, y]), [[9, 5], [0, 10], [-9, 5], [-9, -5], [-0, -10], [9, -5]]);

    const t2 = h.getTile(1, 0);
    cornerTest.same(t2.pointsR.map(({ x, y }) => [x, y]), [[17, 20], [9, 25], [0, 20], [-0, 10], [9, 5], [17, 10]]);

    const t3 = h.getTile(0, 1);
    cornerTest.same(t3.pointsR.map(({ x, y }) => [x, y]), [[9, 5], [0, 10], [-9, 5], [-9, -5], [-0, -10], [9, -5]]);

    cornerTest.end();
  });

  suite.test('should have the expected cube coords', (cubeCornerTest) => {
    const h = new Hexagons(10, 20, true);

    const tile = h.getTile(0, 0);

    cubeCornerTest.same(tile.cube, {
      q: 0,
      r: 0,
      s: 0,
    });

    const tile2 = h.getTile(0, 2);

    cubeCornerTest.same(tile2.cube, {
      q: 2,
      r: 0,
      s: -2,
    });

    const tile3 = h.getTile(2, 2);

    cubeCornerTest.same(tile3.cube, {
      q: 1,
      r: 2,
      s: -3,
    });

    cubeCornerTest.end();
  });

  suite.test('distance', (distTest) => {
    distTest.test('should retrieve neighbors with rad = 1', (nTest) => {
      const h = new Hexagons(10, 20, true);
      const neighbors = h.within(1, 0, 0);
      nTest.ok(_.isEqual(
        neighborPoints(neighbors),
        [{
          x: 0,
          y: 0,
        }, {
          x: 0,
          y: 1,
        }, {
          x: 1,
          y: 0,
        }],
      ));

      const innerNeighbors = h.within(2, 3, 5);
      const np = neighborPoints(innerNeighbors);

      nTest.ok(_.isEqual(np,
        [{ x: 1, y: 5 },
          { x: 2, y: 3 },
          { x: 2, y: 4 },
          { x: 2, y: 5 },
          { x: 2, y: 6 },
          { x: 2, y: 7 },
          { x: 3, y: 3 },
          { x: 3, y: 4 },
          { x: 3, y: 5 },
          { x: 3, y: 6 },
          { x: 3, y: 7 },
          { x: 4, y: 3 },
          { x: 4, y: 4 },
          { x: 4, y: 5 },
          { x: 4, y: 6 },
          { x: 4, y: 7 },
          { x: 5, y: 4 },
          { x: 5, y: 5 },
          { x: 5, y: 6 }]));
      nTest.end();
    });
    distTest.end();
  });

  suite.end();
});
