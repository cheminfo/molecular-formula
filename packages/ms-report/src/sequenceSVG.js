'use strict';

const appendInternals = require('./appendInternals');
const appendResidues = require('./appendResidues');
const appendResiduesPosition = require('./appendResiduesPosition');
const appendResults = require('./appendResults');
const appendRows = require('./appendRows');
const appendRowsInformation = require('./appendRowsInformation');
const addCSS = require('./draw/addCSS');
const addScript = require('./draw/addScript');
const drawInternals = require('./draw/drawInternals');
const drawReplacements = require('./draw/drawReplacements');
const drawSequence = require('./draw/drawSequence');
const getPaper = require('./getPaper');

/**
 *
 * @param {string} sequence
 * @param {array} analysisResult
 * @param {object} [options={}]
 * @param {number} [options.leftRightBorders=50]
 * @param {number} [options.spaceBetweenResidues=30]
 * @param {number} [options.spaceBetweenInternalLines=12]
 * @param {number} [options.strokeWidth=2]
 * @param {string} [options.labelFontFamily='Verdana']
 * @param {number} [options.labelSize=8]
 * @param {object} [options.merge={}]
 * @param {object} [options.merge.charge] Merge results if only differs by charge
 */
function sequenceSVG(sequence, analysisResult, options = {}) {
  const {
    width = 600,
    leftRightBorders = 50,
    spaceBetweenResidues = 30,
    spaceBetweenInternalLines = 12,
    strokeWidth = 2,
    labelFontFamily = 'Verdana',
    labelSize = 8,
    parsing,
    merge,
  } = options;

  const drawOptions = {
    spaceBetweenResidues,
    leftRightBorders,
    spaceBetweenInternalLines,
    strokeWidth,
    labelSize,
    labelFontFamily,
    verticalPosition: spaceBetweenInternalLines,
    width,
  };

  let data = {};
  appendResidues(data, sequence, parsing);
  appendResults(data, analysisResult, {
    merge,
  });
  appendResiduesPosition(data, {
    leftRightBorders,
    spaceBetweenResidues,
    labelFontFamily,
    labelSize,
    width,
  });
  appendRows(data);
  appendInternals(data);
  appendRowsInformation(data);

  // We start to create the SVG and create the paper
  const paper = getPaper();
  addCSS(paper);
  addScript(paper);

  for (let row of data.rows) {
    drawInternals(paper, row, drawOptions);
    drawSequence(paper, row, drawOptions);
  }
  drawReplacements(paper, data, drawOptions);

  paper.size(width, drawOptions.verticalPosition);

  let svg = paper.svg();
  paper.clear();
  return svg;
}

module.exports = sequenceSVG;
