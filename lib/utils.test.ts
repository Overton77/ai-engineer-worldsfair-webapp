import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes (twMerge wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values and supports conditional inputs", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });
});
