import { describe, expect, it } from "vitest";
import { calculatePosition } from "./position";

describe("calculatePosition", () => {
  it("returns 1000 when no neighbors", () => {
    expect(calculatePosition(null, null)).toBe(1000);
  });

  it("inserts before first item (no prev)", () => {
    expect(calculatePosition(null, 1000)).toBe(500);
  });

  it("inserts after last item (no next)", () => {
    expect(calculatePosition(1000, null)).toBe(2000);
  });

  it("inserts between two items", () => {
    expect(calculatePosition(1000, 2000)).toBe(1500);
  });
});
