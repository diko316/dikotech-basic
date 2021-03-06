import {
  OBJECT_TO_STRING,
  OBJECT_HAS_OWN,
  OBJECT_KEYS
} from "../../native/object";

import {
  OBJECT_SIGNATURE,
  ARRAY_SIGNATURE,
  TYPE_SYMBOL,
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_OBJECT
} from "../../native/constants";

import { MATH_MAX } from "../../native/math";

const ACTION_GET_PATH = 0;
const ACTION_GET_SOURCE = 10;
const ACTION_SET_SINGLE_TARGET = 20;
const ACTION_SET_FILTER_TARGET = 30;
const ACTION_UNSET_SINGLE_TARGET = 40;
const ACTION_END = 50;

const POPULATE_DISABLED = 0;
const POPULATE_OBJECT = 1;
const POPULATE_ARRAY = 2;
const POPULATE_SETVALUE = 3;

const TYPE_SINGLE = 1;
const TYPE_FILTER = 2;
const TYPE_ALL = 3;

// types:
//   - 1: single, key
//   - 2: filter, key
//   - 3: all, flag: true(equivalent to [*]), false(any value)

// isNumeric:
//   - true: if data or all items in data is integer
//   - false: if data or one of the items in data is not integer.

// access:
// [
//   [type, isNumeric, data]
// ]

/**
 * Acess Path Type {number}:
 * 1 -  single key access. treats access path data as
 *      object/array property/key.
 *
 * 2 -  filter keys access. treats access path data as collection of
 *      object/array properties/keys.
 *
 * 3 -  all source keys. treats access path data as
 *      {boolean} flag for strict or not strict enumerate source properties/keys
 *
 * @protected
 * @typedef {(1|2|3)} JsonHelperAccessPathType
 */

/**
 * Acess Path Struct
 *
 * @protected
 * @typedef {Array} JsonHelperAccessPath
 * @property {JsonHelperAccessPathType} 0 - Access type to use.
 * @property {boolean}                  1 - true if numeric keys, or false if not.
 * @property {*}                        2 - scalar key if access type is 1.
 *                                          array of keys if access type is 2.
 *                                          boolean if access type is 3.
 */

/**
 * Access Path Fill Option
 *
 * - true if intent is to set value.
 * - false if intent is to delete key/property.
 * - undefined or leave out if intent is to fetch/select properties/keys.
 *
 * @protected
 * @typedef {boolean|undefined} JsonHelperAccessPathFill
 */

/**
 * Get and Set {subject} properties based from accessPath.
 * Update/Populate {subject} property/key values based from accessPath.
 *
 * @protected
 * @param {*} subject - The target object to process
 * @param {JsonHelperAccessPath[]} accessPath - Access path to traverse properties/keys
 * @param {JsonHelperAccessPathFill} [fill] - Required if intent is to set or unset properties/keys
 * @param {*} [value] - Value for setting properties/keys. May omit this parameter if {fill} is undefined or left out.
 * @returns {*} - Access process result based on the following intents:
 *              get/extract intent -      returns {mixed|mixed[]} type.
 *              set property/key value -  returns {mixed} type the "value" itself.
 *              unset property/key -      returns {boolean} where true if successfully deleted. Or false otherwise.
 */
export function access(subject, accessPath, fill, value) {
  const toString = OBJECT_TO_STRING;
  const hasOwn = OBJECT_HAS_OWN;
  const objectKeys = OBJECT_KEYS;

  const objectSignature = OBJECT_SIGNATURE;
  const arraySignature = ARRAY_SIGNATURE;
  const typeSymbol = TYPE_SYMBOL;
  const typeString = TYPE_STRING;
  const typeNumber = TYPE_NUMBER;
  const typeObject = TYPE_OBJECT;

  const isPopulate = fill === true;
  const isDeleteMode = fill === false;

  const actionEnd = ACTION_END;
  const actionGetPath = ACTION_GET_PATH;
  const actionGetSource = ACTION_GET_SOURCE;
  const actionSetSingleTarget = ACTION_SET_SINGLE_TARGET;
  const actionSetFilterTarget = ACTION_SET_FILTER_TARGET;
  const actionUnsetSingleTarget = ACTION_UNSET_SINGLE_TARGET;

  const populateDisabled = POPULATE_DISABLED;
  const populateObject = POPULATE_OBJECT;
  const populateArray = POPULATE_ARRAY;
  const populateSetValue = POPULATE_SETVALUE;

  const typeSingle = TYPE_SINGLE;
  const typeFilter = TYPE_FILTER;
  const typeAll = TYPE_ALL;

  let isCompleted = false;
  let isMultiValue = false;
  let isLastPath = false;
  let isArraySource;
  let allowOverwrite;
  let foundProperty;
  let action = actionGetPath;
  let keyTypeNumeric;
  let populateType;
  let path;
  let pathAfter;
  let pathType;
  let pc = 0;
  let plength;
  let sources = null;
  let source;
  let sourceType;
  let sc = 0;
  let slength;
  let targets;
  let tlength;
  let filters;
  let fc;
  let flength;
  let c;
  let length;
  let from;
  let to;
  let key;

  if (accessPath && accessPath.length) {
    plength = accessPath.length;

    /* eslint no-labels: 0 */
    mainLoop: for (; action !== actionEnd;) {
      // get path
      if (action === actionGetPath) {
        path = pathAfter = null;
        populateType = populateDisabled;

        // no more path, end game
        if (!plength--) {
          action = actionEnd;
          isCompleted = true;
          continue;
        }

        path = accessPath[pc++];
        pathType = path[0];
        keyTypeNumeric = path[1];

        // go through initialize targets from sources
        action = actionGetSource;

        if (plength) {
          pathAfter = accessPath[pc];
          if (isPopulate) {
            populateType = pathAfter[1] ? populateArray : populateObject;
          }
        }
        else {
          isLastPath = true;
          if (isPopulate) {
            populateType = populateSetValue;
          }
        }

        // set to multivalue if filtered or "get all" access
        switch (pathType) {
        case typeFilter:
        case typeAll:
          isMultiValue = true;
        }

        // initialize sources
        if (!source) {
          sources = [subject];
        }
        else if (targets) {
          // cleanup old sources
          sources.length = 0;
          sources = targets;
          // do targets cleanup
          // console.log("found targets ", sources);
        }
        targets = [];
        tlength = sc = 0;
        slength = sources.length;

        // no sources.
        if (!slength) {
          action = actionEnd;
          continue mainLoop;
        }
      }

      // get source
      if (action === actionGetSource) {
        action = actionGetPath;

        // next source
        if (slength--) {
          source = sources[sc++];
          sourceType = source === null ? null : toString.call(source);
          isArraySource = sourceType === arraySignature;
          allowOverwrite = true;

          // extract from source only if eligible source type
          switch (sourceType) {
          case objectSignature:
          case arraySignature:
            // validate compatibility of source key/s and keytype
            if (isArraySource && !keyTypeNumeric) {
              action = actionGetSource;
              continue mainLoop;
            }

            // switch to set target value
            switch (pathType) {
            case typeSingle:
              key = path[2][0];

              // may run unset if delete mode
              action = isLastPath && isDeleteMode
                ? actionUnsetSingleTarget
                : actionSetSingleTarget;
              break;

            case typeFilter:
              // generate filters
              filters = path[2].slice(0);
              fc = 0;
              flength = filters.length;
              action = actionSetFilterTarget;
              break;

            case typeAll:
              // extract object keys
              filters = objectKeys(source);
              fc = 0;
              flength = filters.length;

              // add additional item if expression is "[]" instead of strict "[*]"
              if (isLastPath && isPopulate && isArraySource) { // path[2] !== true) {
                filters[flength] = flength++;

                // don't overwrite if this is the last path access item
                allowOverwrite = false;
              }

              action = actionSetFilterTarget;
            }
            break;

          // not eligible, try next source
          default:
            action = actionGetSource;
            continue mainLoop;
          }
        }
      }

      if (action === actionSetFilterTarget) {
        if (flength--) {
          key = filters[fc++];
          // expand ranged filter
          if (typeof key === typeObject) {
            from = MATH_MAX(1 * key[0], 0) || 0;
            to = MATH_MAX(1 * key[1], 0) || 0;

            // console.log("filter range: ", key);
            // console.log("old filters: ", filters.slice(0));

            // swap if invalid range
            if (from > to) {
              from = from + to;
              to = from - to;
              from = from - to;
            }
            key = from;
            c = fc - 1;
            filters[c++] = from;
            flength += length = to - from;
            for (; length--; c++) {
              filters.splice(c, 0, ++from);
            }

            // console.log("new filters: ", filters);
          }

          // may run unset if delete mode
          action = isLastPath && isDeleteMode
            ? actionUnsetSingleTarget
            : actionSetSingleTarget;
        }
        // next source
        else {
          action = actionGetSource;
        }
      }

      if (action === actionSetSingleTarget) {
        action = actionEnd;

        // only allow scalar keys
        switch (typeof key) {
        case typeSymbol:
        case typeString:
        case typeNumber:
          foundProperty = hasOwn.call(source, key);

          // set
          if (populateType === populateSetValue) {
            if (!foundProperty || allowOverwrite) {
              targets[tlength++] = source[key] = value;
            }
          }
          // get
          else if (foundProperty) {
            targets[tlength++] = source[key];
          }
          // populate
          else if (isPopulate) {
            targets[tlength++] = source[key] = populateType === populateArray ? [] : {};
          }
        }

        // if (hasOwn.call(source, key)) {
        //   console.log("found ", key, " value ", source[key], " source: ", source);
        // }
        // else {
        //   console.log("failed ", key, " in source: ", source);
        // }

        // single is one time
        if (pathType === typeSingle) {
          action = actionGetSource;
        }
        // next action should be next filter
        else {
          action = actionSetFilterTarget;
        }
      }

      if (action === actionUnsetSingleTarget) {
        // only allow scalar keys
        switch (typeof key) {
        case typeSymbol:
        case typeString:
        case typeNumber:
          if (isArraySource) {
            source.splice(1 * key, 1);
          }
          else {
            delete source[key];
          }
        }

        // single is one time
        if (pathType === typeSingle) {
          action = actionGetSource;
        }
        // next action should be next filter
        else {
          action = actionSetFilterTarget;
        }
      }
    }
  }
  // nothing to set
  else if (isPopulate) {
    return undefined;
  }
  // no properties/keys to process
  else if (!isDeleteMode) {
    return subject;
  }

  // delete mode may be completed
  if (isDeleteMode) {
    return isCompleted;
  }

  if (isCompleted) {
    if (isPopulate) {
      return value;
    }

    if (isMultiValue || targets.length) {
      return isMultiValue ? targets : targets[0];
    }
  }

  return undefined;
}
