module.exports = (t) => {
  t.Test.prototype.addAssert('realClose', 2, function (realA, realB, message = '', resolution = 1000) {
    if (!message) {
      message = `${realA} ==± ${realB}`;
    }
    if (typeof realA === 'number' && typeof realB === 'number') {
      const diff = Math.abs(realA - realB);
      this.ok(diff * resolution < 1, message);
    } else {
      this.fail('non-numeric values');
    }
  });
};
