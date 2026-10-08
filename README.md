# bump-semver

**bump-semver** is a zero-dependency CLI and Node.js API that bumps the patch version of **any semver field in
`package.json`** — not just `version`, but custom keys like `devVersion`, `nightlyVersion` or `betaVersion`.
It is built for projects that ship multiple release channels (stable, dev, nightly) and keep a separate version
per channel: a `--floor` option keeps one channel from ever falling behind another, and the new version is
printed to stdout so CI/CD pipelines (GitHub Actions, etc.) can tag and commit releases with a one-liner.

## Why

`npm version` and most version-bump tools only touch the `version` field. When you track several versions in one
`package.json`, you end up writing ad-hoc `jq` or `sed` scripts — and they rarely handle channels drifting apart.
bump-semver does exactly one thing: read a semver field, bump its patch number (optionally starting from a floor
field), write it back, and print the result.

## Install

```sh
npm install --save-dev bump-semver
# or
pnpm add -D bump-semver
```

Or run it without installing:

```sh
npx bump-semver patch
```

## Usage

```sh
# version: 1.2.3 -> 1.2.4
bump-semver patch

# bump a custom field
bump-semver patch --key devVersion

# bump devVersion, but never let it fall behind version
bump-semver patch --key devVersion --floor version

# target another package.json
bump-semver patch --file ./packages/app/package.json
```

Only the new version is written to stdout, so you can capture it directly:

```sh
NEW=$(bump-semver patch --key nightlyVersion --floor version)
git commit -am "nightly v$NEW"
git tag "nightly-v$NEW"
```

### Example: per-channel releases in GitHub Actions

```yaml
- name: Bump nightly version
  run: |
    NEW=$(npx bump-semver patch --key nightlyVersion --floor version)
    git commit -am "nightly v$NEW"
    git tag "nightly-v$NEW"
    git push --follow-tags
```

### Options

```
bump-semver patch

  -k, --key <field>    Field to bump (default: version)
      --floor <field>  Field to use as a lower bound, so the bumped value never goes backwards
  -f, --file <path>    Path to the target package.json (default: ./package.json)
  -h, --help           Show help
```

### How `--floor` works

Use `--floor` when two fields share the same semver line but are updated at different times. If the floor field
is newer than the target field, bump-semver bumps from the floor value instead:

| `version` | `devVersion` (before) | `bump-semver patch --key devVersion --floor version` |
| --------- | --------------------- | ----------------------------------------------- |
| `2.0.0`   | `1.9.9`               | `2.0.1`                                         |
| `1.0.0`   | `1.0.5`               | `1.0.6`                                         |

Only plain `major.minor.patch` values are supported; anything else (e.g. `1.0.0-beta.1`) is rejected with an error.

## API

```ts
import { bumpPatch } from "bump-semver";

// Updates the file in place and returns the new version.
const next = bumpPatch("package.json", { key: "devVersion", floor: "version" });
```

### `bumpPatch(pkgPath, options?)`

| Option  | Type     | Default     | Description                                       |
| ------- | -------- | ----------- | ------------------------------------------------- |
| `key`   | `string` | `"version"` | Field to bump.                                    |
| `floor` | `string` | —           | Field used as a lower bound to prevent regression. |

Returns the new version string. Throws if a field is missing or is not `major.minor.patch`.

## Development

```sh
pnpm install   # prepare runs `obuild --stub`: dist re-exports src, so edits apply immediately
pnpm test
pnpm build:dist
```

`pnpm publish` runs `prepare` after `prepack`, which would overwrite the real bundle with the stub. Publish with
`pnpm release`, which bundles first and then publishes with `--ignore-scripts`.

## License

MIT
