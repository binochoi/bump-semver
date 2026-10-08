#!/usr/bin/env node
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { bumpPatch } from "./index.mts";

const USAGE = `사용법: bump-semver patch

package.json 의 semver 필드를 patch bump 합니다.

옵션:
  -k, --key <field>    bump 대상 필드 (기본: version)
      --floor <field>  이 필드보다 낮아지지 않게 하한으로 삼을 필드 (역행 방지)
  -f, --file <path>    대상 package.json 경로 (기본: 현재 디렉터리)
  -h, --help           이 도움말`;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const { values, positionals } = parseArgs({
  options: {
    key: { type: "string", short: "k", default: "version" },
    floor: { type: "string" },
    file: { type: "string", short: "f", default: "package.json" },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

if (values.help) {
  process.stdout.write(`${USAGE}\n`);
  process.exit(0);
}

const [command] = positionals;

const isUsageInvalid = command !== "patch";
if (isUsageInvalid) {
  fail(USAGE);
}

const pkgPath = resolve(values.file);

try {
  const next = bumpPatch(pkgPath, { key: values.key, floor: values.floor });
  // stdout 은 bump 된 값 전용이다 — `NEW=$(bump-semver patch --key devVersion)` 로 바로 받아 쓸 수 있게.
  process.stdout.write(`${next}\n`);
} catch (error) {
  fail(`[bump-semver] ${error instanceof Error ? error.message : String(error)}`);
}
