# Contributing to TempoFold

TempoFold is plain HTML, CSS and JavaScript with no build step or npm runtime dependencies. Small fixes, clear bug reports, documentation improvements and focused behavior changes are welcome. There is no promised review or response time.

## Work locally

Install Node.js 22 or later, clone the repository, then run:

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. The [README](./README.md#quickstart) has the complete clone commands and a synthetic walkthrough. Use fictional agendas for examples, screenshots and bug reports.

## Find your way around

| Path | Purpose |
| --- | --- |
| `src/core.js` | Agenda validation, timestamp-based timing and deterministic recovery |
| `src/app.js` | Browser controls, dialogs, local storage, JSON and print integration |
| `test/core.test.js` | Focused behavior tests using the Node test runner |
| `examples/` | Portable synthetic agendas |
| `sw.js` | Versioned offline app cache |
| `docs/` | Usage, architecture, design and verification records |
| `brand/` and `marketplace/` | Original identity, actual product screenshots and promotional source |

## Check a change

Run `npm run check` for syntax checks and the focused Node suite. For timing, recovery or import changes, include a behavior test that demonstrates the expected outcome. Keep protected blocks, minimum durations, exact preview/apply behavior and invalid-input preservation intact.

For UI changes, exercise the affected flow with keyboard controls and at a narrow mobile width. Check print or offline use when your change touches them. A documentation-only change needs accurate links, paths, examples and readable rendering; it does not need a broad test suite. Describe what you actually checked in the pull request.

Use a branch and open a pull request with the problem, resulting behavior and relevant verification. Preserve original authorship and third-party notices. Discuss changes that introduce telemetry, cloud services, runtime dependencies or a new product direction before implementing them.

See [architecture and deployment](./docs/architecture.md) for cache updates and deployment behavior. Do not erase user local storage during an update. Maintainers can roll back a published change with an ordinary revert commit while retaining release archives and Git history.

## Support and security

[GitHub issues](https://github.com/aryarashid/tempofold/issues) are the public support channel. Include your browser and OS, expected behavior, actual behavior and short reproduction steps. Attach a minimal synthetic agenda if it helps. Export a backup before troubleshooting stored work. Never post secrets, private workshop data or unredacted storage dumps.

For a suspected security issue, avoid publishing exploit details or sensitive data in a public issue. Use GitHub private vulnerability reporting if the repository offers it, or a private contact method published by [the repository owner](https://github.com/aryarashid). If no private route is available, post only a request for a private reporting channel. No security response SLA or paid support is offered.

## Licenses

Original code, documentation, examples and artwork use [MIT](./LICENSE). Contributions should be compatible with that license and preserve attribution. The bundled Hanken Grotesk font and outlined lettering retain SIL OFL 1.1. Consult [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) before changing or redistributing those assets.
