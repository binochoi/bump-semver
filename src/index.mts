// package.json 의 semver 필드 하나를 patch bump 한다.
import { readFileSync, writeFileSync } from "node:fs";

export interface BumpPatchOptions {
  /** bump 대상 필드. 기본 "version". */
  key?: string;
  /** 이 필드 값보다 낮아지지 않게 하한으로 삼을 필드 (역행 방지). */
  floor?: string;
}

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

function parse(version: string) {
  const match = SEMVER_PATTERN.exec(version.trim());
  if (!match) {
    throw new Error(`major.minor.patch 형식이 아닙니다: "${version}"`);
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function isNewer(a: string, b: string): boolean {
  const pa = parse(a);
  const pb = parse(b);
  if (pa.major !== pb.major) return pa.major > pb.major;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor;
  return pa.patch > pb.patch;
}

function readField(pkg: Record<string, unknown>, key: string): string {
  const value = pkg[key];
  if (typeof value !== "string") {
    throw new Error(`package.json 에 "${key}" 필드가 없습니다`);
  }
  return value;
}

/** pkgPath 의 package.json 에서 `key` 필드를 patch bump 하고 새 값을 반환한다. */
export function bumpPatch(pkgPath: string, options: BumpPatchOptions = {}): string {
  const key = options.key ?? "version";
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  let base = readField(pkg, key);
  if (options.floor !== undefined) {
    const floorValue = readField(pkg, options.floor);
    if (isNewer(floorValue, base)) {
      base = floorValue;
    }
  }

  const { major, minor, patch } = parse(base);
  const next = `${major}.${minor}.${patch + 1}`;

  pkg[key] = next;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return next;
}
