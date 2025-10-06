import { minimizeTransfers } from "./utils";

describe("minimizeTransfers", () => {
  test("zero balances -> no transfers", () => {
    expect(minimizeTransfers({ a: 0, b: 0 })).toEqual([]);
  });

  test("simple one-to-one", () => {
    expect(minimizeTransfers({ a: -10, b: 10 })).toEqual([{ from: "a", to: "b", amount: 10 }]);
  });

  test("one debtor, two creditors", () => {
    const res = minimizeTransfers({ a: -30, b: 10, c: 20 });
    expect(res).toEqual([
      { from: "a", to: "c", amount: 20 },
      { from: "a", to: "b", amount: 10 },
    ]);
  });

  test("two debtors, one creditor", () => {
    const res = minimizeTransfers({ a: -5, b: -15, c: 20 });
    expect(res).toEqual([
      { from: "b", to: "c", amount: 15 },
      { from: "a", to: "c", amount: 5 },
    ]);
  });

  test("floating precision rounding", () => {
    const res = minimizeTransfers({ a: -10.005, b: 10.005 });
    expect(res).toEqual([{ from: "a", to: "b", amount: 10.01 }]);
  });

  test("already balanced after ignoring eps", () => {
    // very small residuals should be ignored
    const res = minimizeTransfers({ a: -0.0000004, b: 0.0000003, c: 0.0000001 });
    expect(res).toEqual([]);
  });
});
