import MANIFEST from "./parser-reference.json";

import { tokenize } from "./tokenizer";

import { reportParseError } from "./error-reporting";

export function parse(subject) {
  const manifest = MANIFEST;
  const reference = manifest.reference;
  const report = reportParseError;
  const rpn = [];

  let index = 0;
  let rpnLength = 0;
  let operands = 0;
  let isExpectingOperand = true;
  let line = 1;
  let stack = null;
  let stackNode = null;
  let isSeparator;
  let separator;
  let isMultiArguments;
  let isEnder;
  let stackPop;
  let stackPush;
  let stackOutput;
  let value;
  let from;
  let to;
  let token;
  let node;
  let definition;
  let item;
  let precedence;
  let expectedOperands;
  let max;

  /* eslint no-labels: 0 */
  loop: for (token = tokenize(subject, index); token; token = tokenize(subject, index)) {
    value = token[1];
    from = index;
    index = to = token[2];
    line += token[3];
    token = token[0];
    definition = reference[token];

    isSeparator =
      isMultiArguments = false;

    // preprocess
    switch (definition[0]) {
    case 0: continue loop;
    case 4:
      isMultiArguments = true;
      break;

    case 5:
      isSeparator = true;
      break;

    case 3:
      definition = isExpectingOperand
        ? definition[1]
        : definition[2];
      break;
    }

    // node
    node = {
      rule: definition[1],
      token,
      value,
      operands: 0,
      min: 0,
      max: 0,
      augmented: true,
      from,
      to,
      line
    };

    stackPop =
      stackPush =
      stackOutput = false;

    switch (definition[0]) {
    case 10: // operand
      operands++;
      rpn[rpnLength++] = node;
      node.augmented = isExpectingOperand = false;
      break;

    case 1: // infix unary
    case 2: // binary
    case 4: // multi arguments
    case 5: // separator
      if (isMultiArguments) {
        node.separator = definition[6];
      }

      // separator only
      if (isSeparator) {
        stackNode = null;
        for (item = stack; item; item = item[0]) {
          stackNode = item[1];
          if (stackNode.separator) {
            node.precedence = stackNode.precedence + 1;
            break;
          }
          if (stackNode.ender) {
            break;
          }
        }
        node.min = node.max = 2;
        node.isSeparator = true;
        if (!stackNode || stackNode.separator !== node.token) {
          report("Invalid parameter separator.", node);
          return null;
        }
      }
      else {
        node.min = definition[3];
        node.max = definition[4];
        node.precedence = definition[5];
      }

      isExpectingOperand =
        stackPop =
        stackPush = true;
      break;

    case 15: // enclosure
      node.precedence = precedence = definition[5];
      node.ender = definition[6];
      node.separator = definition[7];

      if (precedence) {
        stackPop = true;
      }

      if (separator) {
        node.separator = separator;
      }

      stackPush =
        isExpectingOperand = true;
      break;

    case 16: // ender
      isExpectingOperand = false;

    // falls through
    case 20: // end
      node.precedence = 0;
      stackOutput = true;
      break;
    }

    if (stackPop || stackOutput) {
      isSeparator = node.isSeparator || false;
      precedence = node.precedence;

      for (; stack; stack = stack[0]) {
        item = stack[1];
        isEnder = item.ender;

        if (!isEnder && item.precedence >= precedence) {
          expectedOperands = item.operands += operands;
          operands = 1;
          max = item.max;

          if (expectedOperands < item.min ||
            (max && max > expectedOperands)
          ) {
            report("Invalid number of operands.", item);
            return null;
          }

          if (item.rule) {
            rpn[rpnLength++] = item;
          }
          continue;
        }

        if (isSeparator && item.separator) {
          item.operands += operands;
          operands = 1;
        }
        else if (stackOutput) {
          item.operands += operands;
          operands = 0;

          // postfix ender
          if (isEnder && item.precedence) {
            item.ender = false;
          }
          else {
            expectedOperands = item.operands;
            max = item.max;

            if (expectedOperands < item.min ||
              (max && max > expectedOperands)
            ) {
              report("Invalid number of operands.", item);
              return null;
            }

            if (item.rule) {
              rpn[rpnLength++] = item;
            }
            stack = stack[0];
          }
        }
        break;
      }
    }

    if (stackPush) {
      node.operands += operands;
      operands = 0;
      stack = [stack, node];
    }
  }

  return rpn;
}
