'use strict';

const matcher = require('../msemMatcher');

test('test msemMatcher', () => {
  let entry = {
    mf: 'C10',
    em: 120,
    msem: 0,
    charge: 0,
    unsaturation: 11,
    atoms: {
      C: 10
    }
  };

  expect(matcher(entry, { targetMass: 120, minCharge: 1 })).toBe(false);
  expect(matcher(entry, { targetMass: 120, maxCharge: -1 })).toBe(false);
  expect(
    matcher(entry, {
      targetMass: 120,
      ionization: { charge: 1, em: 0 },
      atoms: {
        N: { min: 10, max: 20 }
      }
    })
  ).toBe(false);
  expect(
    matcher(entry, {
      targetMass: 120,
      atoms: {
        C: { min: 5, max: 9 }
      }
    })
  ).toBe(false);
  expect(
    matcher(entry, {
      targetMass: 120,
      ionization: { charge: 1, em: 0 },
      atoms: {
        C: { min: 10, max: 20 },
        N: { min: 0, max: 10 }
      }
    })
  ).toStrictEqual({
    ionization: { charge: 1, em: 0 },
    ms: {
      charge: 1,
      delta: -0.0005485799090649834,
      em: 119.99945142009094,
      ionization: undefined,
      ppm: 4.571499242208195
    }
  });
});

test('test msemMatcher with list of target mass', () => {
  let entry = {
    mf: 'C10',
    em: 120,
    msem: 0,
    charge: 0,
    unsaturation: 11,
    atoms: {
      C: 10
    },
    ionization: { mf: 'H+', charge: 1, em: 0 }
  };

  expect(
    matcher(entry, {
      targetMasses: [119, 120, 121, 122, 123]
    })
  ).toStrictEqual({
    ionization: { charge: 1, em: 0, mf: 'H+' },
    ms: {
      charge: 1,
      delta: -0.0005485799090649834,
      em: 119.99945142009094,
      ionization: 'H+',
      ppm: 4.571499242208195
    },
    target: { mass: 120 }
  });

  expect(
    matcher(entry, {
      targetMasses: [119, 120, 121, 122, 123],
      targetIntensities: [5, 10, 15, 10, 5]
    })
  ).toStrictEqual({
    ionization: { charge: 1, em: 0, mf: 'H+' },
    ms: {
      charge: 1,
      delta: -0.0005485799090649834,
      em: 119.99945142009094,
      ionization: 'H+',
      ppm: 4.571499242208195
    },
    target: { mass: 120, intensity: 10 }
  });
});

test('test msemMatcher with forced ionization', () => {
  let entry = {
    mf: 'C10',
    em: 120,
    msem: 0,
    charge: 0,
    unsaturation: 11,
    atoms: {
      C: 10
    },
    ionization: { mf: 'H+', charge: 1, em: 1 }
  };

  expect(
    matcher(entry, {
      targetMass: 120,
      maxCharge: 1,
      minCharge: 1,
      ionization: { mf: 'H+', charge: 1, em: 0 },
      forceIonization: true
    })
  ).toStrictEqual({
    ionization: { charge: 1, em: 0, mf: 'H+' },
    ms: {
      charge: 1,
      delta: -0.0005485799090649834,
      em: 119.99945142009094,
      ionization: 'H+',
      ppm: 4.571499242208195
    }
  });
});