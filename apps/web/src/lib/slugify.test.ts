import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("My Project")).toBe("my-project");
  });

  it("strips special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a--b  c")).toBe("a-b-c");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("truncates at 50 characters", () => {
    expect(slugify("a".repeat(60))).toHaveLength(50);
  });

  it("falls back to untitled on empty input", () => {
    expect(slugify("!!!")).toBe("untitled");
  });
});
