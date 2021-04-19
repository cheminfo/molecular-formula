'use strict';

let PEP = require('..');

describe('Checking split peptide', () => {
  it('Normal sequence split', () => {
    let result = PEP.splitPeptide('HAlaGlyLysHisAspOH');
    expect(result).toEqual(['Ala', 'Gly', 'Lys', 'His', 'Asp']);
  });

  it('Sequence split : nothing on N-term', () => {
    let result = PEP.splitPeptide('AlaGlyLysHisAspOH');
    expect(result).toEqual(['Ala', 'Gly', 'Lys', 'His', 'Asp']);
  });

  it('Sequence split : nothing on C-term', () => {
    let result = PEP.splitPeptide('HAlaGlyLysHisAsp');
    expect(result).toEqual(['Ala', 'Gly', 'Lys', 'His', 'Asp']);
  });
});
