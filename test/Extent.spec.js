const { Box2, Vector2 } = require('three');
const tap = require('tap');
const { Extent } = require('../lib');

tap.test('Extent', (suite) => {
  const points = [{ x: 10, y: 0 }, { x: -5, y: 20 }, { x: 100, y: 2 }];
  const e = new Extent(points);
  suite.test('dim', (dimTest) => {
    dimTest.test('should find the range of points', (diRange) => {
      const dim = e.dim('x');

      diRange.same(dim.min, -5);
      diRange.same(dim.max, 100);
      diRange.same(dim.mid, 47.5);
      diRange.end();
    });

    dimTest.end();
  });

  suite.test('center', (center) => {
    center.test('should find center', (centerFind) => {
      centerFind.same(e.center.x, 47.5);
      centerFind.same(e.center.y, 10);
      centerFind.end();
    });

    center.end();
  });

  suite.test('toBox', (toBoxtest) => {
    const trapBox = new Extent([{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 2 }, { x: 2, y: 2 }]);

    toBoxtest.test('should have the right points', (pointsTest) => {
      const boxedPoints = trapBox.fitToBox(new Box2(new Vector2(-30, -30), new Vector2(30, 30)));
      pointsTest.same(boxedPoints.list.map((n) => n.toArray()), [[-30, -30], [10, -30], [30, -10], [-10, -10]]);
      pointsTest.end();
    });

    toBoxtest.end();
  });

  suite.end();
});
