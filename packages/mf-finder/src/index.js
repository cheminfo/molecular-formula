'use strict';

const preprocessRanges = require('./preprocessRanges');
const preprocessIonizations = require('mf-utils/src/preprocessIonizations');
const getMsInfo = require('mf-utils/src/getMsInfo');
const TargetMassCache = require('./TargetMassCache');
/**
 * Returns possible combinations
 * * @return {}
 */


let targetMassCache;

module.exports = function findMF(targetMass, options = {}) {
    const {
        minCharge = Number.MIN_SAFE_INTEGER,
        maxCharge = Number.MAX_SAFE_INTEGER,
        minUnsaturation = Number.MIN_SAFE_INTEGER,
        maxUnsaturation = Number.MAX_SAFE_INTEGER,
        onlyIntegerUnsaturation = false,
        onlyNonIntegerUnsaturation = false,
        maxIterations = 1e8,
        allowNeutral = false, // msem because em in this case !
        ranges = [
            { mf: 'C', min: 0, max: 100 },
            { mf: 'H', min: 0, max: 100 },
            { mf: 'O', min: 0, max: 100 },
            { mf: 'N', min: 0, max: 100 },
        ],
    } = options;

    let filterUnsaturation = (minUnsaturation !== Number.MIN_SAFE_INTEGER || maxUnsaturation !== Number.MAX_SAFE_INTEGER || onlyIntegerUnsaturation || onlyNonIntegerUnsaturation);
    // we calculate not the real unsaturation but the one before dividing by 2 + 1
    let fakeMinUnsaturation = (minUnsaturation === Number.MIN_SAFE_INTEGER) ? Number.MIN_SAFE_INTEGER : (minUnsaturation - 1) * 2;
    let fakeMaxUnsaturation = (maxUnsaturation === Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : (maxUnsaturation - 1) * 2;

    let filterCharge = (minCharge !== Number.MIN_SAFE_INTEGER || maxCharge !== Number.MAX_SAFE_INTEGER);

    let result = {
        mfs: []
    };

    // we need to make the processing for all the ionizations
    let ionizations = preprocessIonizations(options.ionizations);
    for (let ionization of ionizations) {

        let currentIonization = {
            currentMonoisotopicMass: ionization.em,
            currentCharge: ionization.charge,
            currentUnsaturation: 0 // we don't take into account the unsaturation of the ionization agent
        };
        // if (DEBUG) console.log('new ionization', ionization.mf, ionization.em, ionization.charge);
        // ionization em and charge will be used to set the first atom value
        let possibilities = preprocessRanges(ranges);
        if (possibilities.length === 0) return { mfs: [] };
        targetMassCache = new TargetMassCache(targetMass, possibilities, Object.assign({}, options, { charge: ionization.charge }));
        result.info = {
            numberMFEvaluated: 0,
            numberResults: 0,
        };


        let theEnd = false;
        let maxPosition = possibilities.length;
        let lastPosition = possibilities.length - 1;
        let currentPosition = 0;
        let currentAtom;
        let previousAtom;
        let lastPossibility = possibilities[lastPosition];

        initializePossibilities(possibilities, currentIonization);

        //  if (DEBUG) console.log('possibilities', possibilities.map((a) => `${a.mf + a.originalMinCount}-${a.originalMaxCount}`));

        let isValid = false; // designed so that the first time it is not a valid solution
        while (!theEnd) {
            if (result.info.numberMFEvaluated++ > maxIterations) {
                throw Error(`Iteration number is over the current maximum of: ${maxIterations}`);
            }
            if (filterUnsaturation) {
                let unsaturation = lastPossibility.currentUnsaturation;
                let isOdd = Math.abs(unsaturation % 2);
                if (
                    (onlyIntegerUnsaturation && isOdd === 1) ||
                    (onlyNonIntegerUnsaturation && isOdd === 0) ||
                    (fakeMinUnsaturation > unsaturation) ||
                    (fakeMaxUnsaturation < unsaturation)
                ) isValid = false;
            }
            if (filterCharge && (lastPossibility.currentCharge < minCharge || lastPossibility.currentCharge > maxCharge)) {
                isValid = false;
            }

            if (isValid) {
                let minMass = targetMassCache.getMinMass(lastPossibility.currentCharge);
                let maxMass = targetMassCache.getMaxMass(lastPossibility.currentCharge);
                if ((lastPossibility.currentMonoisotopicMass < minMass) || (lastPossibility.currentMonoisotopicMass > maxMass)) {
                    isValid = false;
                }
            }
            if (isValid) {
                result.mfs.push(getResult(possibilities, targetMass, allowNeutral, ionization));
                result.info.numberResults++;
            }

            isValid = true;
            // we need to setup all the arrays if possible
            while (currentPosition < maxPosition && currentPosition >= 0) {
                currentAtom = possibilities[currentPosition];
                previousAtom = (currentPosition === 0) ? currentIonization : possibilities[currentPosition - 1];
                if (currentAtom.currentCount < currentAtom.currentMaxCount) {
                    currentAtom.currentCount++;
                    updateCurrentAtom(currentAtom, previousAtom);
                    if (currentPosition < lastPosition) {
                        currentPosition++;
                        setCurrentMinMax(possibilities[currentPosition], possibilities[currentPosition - 1]);
                    } else {
                        break;
                    }
                } else {
                    currentPosition--;
                }
            }

            if (currentPosition < 0) {
                theEnd = true;
            }
        }
    }

    result.mfs.sort((a, b) => a.ms.ppm - b.ms.ppm);
    return result;
};

function updateCurrentAtom(currentAtom, previousAtom) {
    currentAtom.currentMonoisotopicMass = previousAtom.currentMonoisotopicMass + currentAtom.em * currentAtom.currentCount;
    currentAtom.currentCharge = previousAtom.currentCharge + currentAtom.charge * currentAtom.currentCount;
    currentAtom.currentUnsaturation = previousAtom.currentUnsaturation + currentAtom.unsaturation * currentAtom.currentCount;
}

function getResult(possibilities, targetMass, allowNeutralMolecules, ionization) {
    let lastPossibility = possibilities[possibilities.length - 1];

    let result = {
        em: lastPossibility.currentMonoisotopicMass - ionization.em,
        unsaturation: lastPossibility.currentUnsaturation,
        mf: '',
        charge: lastPossibility.currentCharge - ionization.charge,
        ionization
    };


    // we check that the first time we meet the ionization group it does not end
    // in the final result
    for (let possibility of possibilities) {
        if (possibility.currentCount !== 0) {
            if (possibility.isGroup) {
                result.mf += `(${possibility.mf})`;
                if (possibility.currentCount !== 1) result.mf += possibility.currentCount;
            } else {
                result.mf += possibility.mf;
                if (possibility.currentCount !== 1) result.mf += possibility.currentCount;
            }
        }
    }
    result.unsaturation = (result.unsaturation + Math.abs(result.charge)) / 2 + 1;
    result.ms = getMsInfo(result, { targetMass, allowNeutralMolecules });
    return result;
}

function setCurrentMinMax(currentAtom, previousAtom) {
    // the current min max can only be optimize if the charge will not change anymore
    if (currentAtom.innerCharge === true || currentAtom.charge !== 0) {
        currentAtom.currentMinCount = currentAtom.originalMinCount;
        currentAtom.currentMaxCount = currentAtom.originalMaxCount;
        currentAtom.currentCount = currentAtom.currentMinCount - 1;
    } else { // no more change of charge, we can optimize
        let currentMass = previousAtom !== undefined ? previousAtom.currentMonoisotopicMass : 0;
        let currentCharge = previousAtom !== undefined ? previousAtom.currentCharge : 0;
        currentAtom.currentMinCount = Math.max(Math.floor((targetMassCache.getMinMass(currentCharge) - currentMass - currentAtom.maxInnerMass) / currentAtom.em), currentAtom.originalMinCount);
        currentAtom.currentMaxCount = Math.min(Math.floor((targetMassCache.getMaxMass(currentCharge) - currentMass - currentAtom.minInnerMass) / currentAtom.em), currentAtom.originalMaxCount);
        currentAtom.currentCount = currentAtom.currentMinCount - 1;
    }
}


function initializePossibilities(possibilities, currentIonization) {
    for (let i = 0; i < possibilities.length; i++) {
        if (i === 0) {
            updateCurrentAtom(possibilities[i], currentIonization);
            setCurrentMinMax(possibilities[i], currentIonization);
        } else {
            updateCurrentAtom(possibilities[i], possibilities[i - 1]);
        }
    }
}

// eslint-disable-next-line no-unused-vars
function possibilitiesToString(possibilities) {
    return possibilities.map((a) => [`mf:${a.mf}`, `current:${a.currentCount}`, `min:${a.currentMinCount}`, `max:${a.currentMaxCount}`, `charge:${a.currentCharge}`]);
}