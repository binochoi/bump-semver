import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bumpPatch } from "./index.mts";

function makePkg(obj: Record<string, unknown>, dir = tmpdir()): string {
  const path = join(dir, `bumver-test-${Date.now()}-${Math.random()}.json`);
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
  return path;
}

describe("bumpPatch", () => {
  const files: string[] = [];

  beforeEach(() => files.splice(0));
  afterEach(() => files.forEach((f) => { try { unlinkSync(f); } catch {} }));

  test("version 필드를 patch bump 한다", () => {
    const path = makePkg({ name: "a", version: "1.2.3" });
    files.push(path);
    expect(bumpPatch(path)).toBe("1.2.4");
  });

  test("임의 key 필드를 bump 한다", () => {
    const path = makePkg({ name: "a", version: "1.0.0", devVersion: "1.0.0" });
    files.push(path);
    expect(bumpPatch(path, { key: "devVersion" })).toBe("1.0.1");
  });

  test("floor 필드보다 낮아지지 않는다", () => {
    // devVersion이 version보다 낮을 때 version을 하한으로 삼아 bump
    const path = makePkg({ name: "a", version: "2.0.0", devVersion: "1.9.9" });
    files.push(path);
    expect(bumpPatch(path, { key: "devVersion", floor: "version" })).toBe("2.0.1");
  });

  test("floor 필드보다 높으면 그대로 +1", () => {
    const path = makePkg({ name: "a", version: "1.0.0", devVersion: "1.0.5" });
    files.push(path);
    expect(bumpPatch(path, { key: "devVersion", floor: "version" })).toBe("1.0.6");
  });

  test("잘못된 semver 형식이면 에러", () => {
    const path = makePkg({ name: "a", version: "not-a-version" });
    files.push(path);
    expect(() => bumpPatch(path)).toThrow();
  });

  test("존재하지 않는 key 이면 에러", () => {
    const path = makePkg({ name: "a", version: "1.0.0" });
    files.push(path);
    expect(() => bumpPatch(path, { key: "missing" })).toThrow();
  });
});
