// import { FUNCTION } from "../native/function";

import { parse } from "./parser";

// import { reportCompileError } from "./error-reporting";

// import {
//   preprocess,
//   postprocess
// } from "./compile/initialize";

import {
  operand
} from "./compile/operand";

import {
  objectAccess
} from "./compile/object-access";

import {
  arithmetic
} from "./compile/arithmetic";

import {
  condition
} from "./compile/condition";

// import {
//   get
// } from "./compile/query";

export function show(rpn) {
  const output = [];

  rpn.forEach(
    (item, index) => {
      output[index] = item.value;
    }
  );

  console.log("rpn: ", output.join(" "));
}

export function compile(subject) {
  const rpn = parse(subject);
  // const report = reportCompileError;
  const symbols = [];
  const stack = [];
  const features = {
    symbols: true,
    finite: false,
    signature: false,
    objectHasOwn: false,
    objectPrototype: false
  };

  let slength = 0;
  let rlength = 0;
  let rc = 0;
  let lexeme = null;
  let operands = null;

  if (!rpn) {
    return null;
  }

  show(rpn);

  for (rlength = rpn.length; rlength--; rc++) {
    lexeme = rpn[rc];
    symbols[symbols.length] = lexeme.symbol;

    // operands
    if (lexeme.type === "operand") {
      lexeme.augmented = false;
      operand(lexeme, symbols);
      stack[slength++] = lexeme;
      continue;
    }

    lexeme.augmented = true;

    // resolve operands
    operands = lexeme.operands;
    if (operands) {
      slength -= operands;
      operands = stack.slice(slength, slength + operands);
    }
    else {
      operands = [];
    }

    switch (lexeme.rule) {
    // arithmetic
    case "add":
    case "sub":
    case "mul":
    case "div":
    case "mod":
      features.finite = true;
      arithmetic(
        lexeme,
        symbols,
        operands
      );
      break;

    // condition
    case "eq":
    case "neq":
    case "gt":
    case "gte":
    case "lt":
    case "lte":
    case "pattern":
      condition(lexeme, operands[0], operands[1]);
      features.signature = true;
      break;

    // object
    case "access":
      objectAccess(lexeme, operands[0], operands[1]);
    }

    stack[slength++] = lexeme;
  }
}

// export function compile(subject) {
//   const rpn = parse(subject);
//   const report = reportCompileError;
//   const code = [];
//   const symbols = [];
//   const stack = [];
//   const features = {
//     symbols: true,
//     finite: false,
//     signature: false,
//     objectHasOwn: false,
//     objectPrototype: false
//   };
//   let stackLength = 0;
//   let node = 0;
//   let nodeId = null;
//   let operands = null;

//   // dont if no rpn created
//   if (!rpn) {
//     return null;
//   }

//   const output = [];
//   rpn.forEach(
//     (item, index) => {
//       output[index] = item.value;
//     }
//   );

//   console.log("rpn: ", output.join(" "));
//   console.log(rpn);

//   preprocess(code);

//   // generate source code
//   for (let c = 0, length = rpn.length; length--; c++) {
//     node = rpn[c];

//     // operands
//     if (node.type === "operand") {
//       node.augmented = false;
//       operand(node, code, symbols);
//       stack[stackLength++] = node;
//       continue;
//     }

//     operands = node.operands;

//     if (stackLength < operands) {
//       report(
//         `Low on operands ${node.value}`,
//         node
//       );
//       console.log(
//         code.join("\r\n")
//       );
//       return null;
//     }
//     node.augmented = true;
//     nodeId = node.id;
//     stackLength -= operands;
//     operands = stack.slice(stackLength, stackLength + operands);
//     node.arguments = operands;

//     switch (nodeId) {
//     case "get":
//       get(features, node, code, symbols);
//       break;

//     case "add":
//     case "sub":
//     case "mul":
//     case "div":
//     case "mod":
//       arithmetic(features, node, code, symbols);
//       stack[stackLength++] = node;
//       break;

//     case "eq":
//     case "neq":
//     case "gt":
//     case "gte":
//     case "lt":
//     case "lte":
//     case "pattern":
//       condition(features, node, code);
//       stack[stackLength++] = node;
//       break;

//     case "access":
//       access(features, node, code, symbols);
//       stack[stackLength++] = node;
//       break;

//     case "list":
//       break;

//     default:
//       console.log("unprocessed ", node);
//     }

//     // console.log(
//     //   "id", nodeId,
//     //   "operands", operands,
//     //   "stack", stack.slice(0, stackLength)
//     // );
//   }

//   postprocess(
//     code,
//     symbols,
//     features
//   );

//   try {
//     const compiled = new FUNCTION("root", code.join("\n"));
//     compiled({});
//     console.log(
//       compiled.toString()
//     );
//   }
//   catch (error) {
//     console.log(code.join("\n"));
//     throw error;
//   }
// }
