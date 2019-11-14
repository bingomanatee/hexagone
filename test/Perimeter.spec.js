const _ = require('lodash');
const tap = require('tap');
// const Perimeter = require('./Perimeter');
const { World } = require('../lib');
const addRealTest = require('./addRealTest');

addRealTest(tap);

tap.test('Perimeter', (suite) => {
  const world = new World('alpha', 1);

  const perim3 = world.perimeters.get(3);
  //       ║          3  │        -50.0  │         30.9  │         80.9  │
  // world.table(true);

  suite.test('should have the right center', (perimTest) => {
    const { point } = perim3;
    perimTest.realClose(point.x, -0.5, '', 100);
    perimTest.realClose(point.y, 0.309, '', 100);
    perimTest.realClose(point.z, 0.809, '', 100);
    perimTest.end();
  });

  suite.test('should have the right adjacent faces', (afTest) => {
    const af = _.map(perim3.adjacentFaces, 'i');
    const has3 = _(perim3.faces)
      .filter((f) => f.has(3)).map('i').value();
    afTest.same(af, has3);
    afTest.end();
  });

  suite.test('should order the faces', (ofTest) => {
    const { orderedFaces } = perim3;
    ofTest.same(orderedFaces.length, 6);
    orderedFaces.forEach((face, i) => {
      if (i) {
        const prev = orderedFaces[i - 1];
        ofTest.same(_.intersection(face.points(), prev.points()).length, 2);
      }
    });
    ofTest.end();
  });

  suite.test('should get midpoints of the faces', (pTest) => {
    const { points, orderedFaces } = perim3;
    const centers = _.invokeMap(orderedFaces, 'center', perim3.vertices);
    points.forEach((p, i) => pTest.ok(p.equals(centers[i])));
    pTest.end();
  });

  /*  suite.test('should return lat lon', (test2) => {
    const ll = perim3.pointsLatLon;
  }); */

  suite.end();
});
