import { expect } from "chai";
import { showErrors } from "./error-reporting";
import { parse } from "./parser";

function serializeRpn(rpn) {
  const content = [];
  let c;
  let length;
  let item;

  if (!rpn) {
    return null;
  }

  for (c = 0, length = rpn.length; length--; c++) {
    item = rpn[c];
    if (item.reduce === 0) {
      content[c] = item.ruleId;
      continue;
    }
    content[c] = (
      [
        item.ruleId,
        "|",
        item.reduce
      ]
    ).join("");
  }

  return content.join(" ");
}

function parseAndSerialize(subject) {
  return serializeRpn(parse(subject));
}

showErrors(true);

describe("parse(subject)", () => {
  it("Should parse number, float, and percent.", () => {
    expect(parseAndSerialize("1")).to.not.equal(null);
    expect(parseAndSerialize("    +2")).to.not.equal(null);
    expect(parseAndSerialize("-2.00 ")).to.not.equal(null);
  });

  it("Should parse variables.", () => {
    expect(parseAndSerialize("@")).to.not.equal(null);
    expect(parseAndSerialize("@test")).to.not.equal(null);
    expect(parseAndSerialize("?")).to.not.equal(null);
  });

  it("Should parse Json Path.", () => {
    expect(parseAndSerialize(".")).to.not.equal(null);
    expect(parseAndSerialize(".test")).to.not.equal(null);
    expect(parseAndSerialize("test.1")).to.not.equal(null);
    expect(parseAndSerialize("test")).to.not.equal(null);
    
    expect(parseAndSerialize(".1")).to.not.equal(null);
    expect(parseAndSerialize(".[1]")).to.not.equal(null);
    expect(parseAndSerialize(".[1..10]")).to.not.equal(null);
    expect(parseAndSerialize(".[2, 1..10]")).to.not.equal(null);
    expect(parseAndSerialize(".[2, 1..10].diko")).to.not.equal(null);

    expect(parseAndSerialize("@[2, 1..10].diko")).to.not.equal(null);
    expect(parseAndSerialize("root[2, 1..10].diko")).to.not.equal(null);
    expect(parseAndSerialize("@root[2, 1..10].diko")).to.not.equal(null);
    expect(parseAndSerialize("[test]")).to.not.equal(null);

    expect(parseAndSerialize("([test]).name")).to.not.equal(null);
  });

  it("Should parse Arithmetic and concatenation.", () => {
    expect(parseAndSerialize("1 * 1 / 2")).to.not.equal(null);
    expect(parseAndSerialize("1 - 1 / 2 + 3")).to.not.equal(null);
    expect(parseAndSerialize("\"test\" + 3")).to.not.equal(null);
    expect(parseAndSerialize("1 + \"test\"")).to.not.equal(null);
    expect(parseAndSerialize("1 + \"test\" + 3")).to.not.equal(null);
  });

  it("Should parse Comparison operator.", () => {
    expect(parseAndSerialize("\"test\" > \"big\"")).to.not.equal(null);
    expect(parseAndSerialize("\"test\" > 1")).to.not.equal(null);
    expect(parseAndSerialize("22 > \"big\"")).to.not.equal(null);
    expect(parseAndSerialize("\"test\" + 10 > 1 + 2")).to.not.equal(null);

    expect(parseAndSerialize("\"diko\" || 1 && 2 || 3 && null")).to.not.equal(null);

    expect(parseAndSerialize("\"diko\" =~ /regex/")).to.not.equal(null);
    expect(parseAndSerialize("\"diko\" =~ \"diko\"")).to.not.equal(null);
  });

  it("Should parse Ternary operator.", () => {
    expect(parseAndSerialize("test ? 1 + 'b': 2")).to.not.equal(null);
    expect(parseAndSerialize("test ? -1 + 'b': 2")).to.not.equal(null);
    expect(parseAndSerialize("true ? -1 : 2")).to.not.equal(null);
    expect(parseAndSerialize("? ? -1 + 'b': 2")).to.not.equal(null);
  });

  it("Should parse Assignment operator.", () => {
    expect(parseAndSerialize("a = \"test\" > \"big\"")).to.not.equal(null);
    expect(parseAndSerialize("a = \"big\"")).to.not.equal(null);
    expect(parseAndSerialize("b = .a = ? ? -1 + 'b': 2")).to.not.equal(null);
  });

  it("Should parse Assignment operator.", () => {
    expect(parseAndSerialize("a = \"test\" > \"big\"")).to.not.equal(null);
    expect(parseAndSerialize("a = \"big\"")).to.not.equal(null);
    expect(parseAndSerialize("b = .a = ? ? -1 + 'b': 2")).to.not.equal(null);
  });

  it("Should parse Function call operator.", () => {
    expect(parseAndSerialize("call(a = \"test\" > \"big\")")).to.not.equal(null);
    expect(parseAndSerialize("customFunction(1, \"test\" > \"big\")")).to.not.equal(null);
    expect(parseAndSerialize("filter()")).to.not.equal(null);
  });

  it("Should parse Filter operator.", () => {
    expect(parseAndSerialize("1 == \"test\" | enlarge | set: a, b")).to.not.equal(null);
    expect(parseAndSerialize("nul | enlarge")).to.not.equal(null);
  });

  it("Just trying out.", () => {
    expect(parseAndSerialize("\"diko\" =~ /regex/")).to.not.equal(null);
  });

  // it.only("Just trying out.", () => {
  //   // console.log(parseAndSerialize("\"test\" + 10 > 1 + 2"));
  //   // console.log(parse("1"));
  //   console.log(parseAndSerialize(".[1]"));
  //   console.log(parseAndSerialize(".[1..10]"));
  // });
});
