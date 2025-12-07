## [1.0.7](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.6...v1.0.7) (2025-12-07)


### Bug Fixes

* add checks:write permission to sync-main-to-dev workflow ([51b62cb](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/51b62cbc0ed33b1726a90fed9953ed4305a36326))

## [1.0.6](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.5...v1.0.6) (2025-12-06)


### Bug Fixes

* handle missing dist-executable directory in Windows build workflow ([d50472c](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/d50472c620f9dfc5672ea9e0da6653501261b8b4))

## [1.0.5](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.4...v1.0.5) (2025-12-06)


### Bug Fixes

* explicitly report CI / lint-test check status to match Ruleset requirement ([c75d2ac](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/c75d2acd9c8ee5d3abf1bddb14fb9584c4656f05))

## [1.0.4](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.3...v1.0.4) (2025-12-06)


### Bug Fixes

* enable CI workflow for PRs to main branch ([582116a](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/582116ac7eb12c3121408e8b674fc3cc93d83150))

## [1.0.3](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.2...v1.0.3) (2025-12-06)


### Bug Fixes

* exclude tests from build and improve executable build workflow ([e1199e6](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/e1199e67db67175329e63baeae69e9a9b77bf4a9))

## [1.0.2](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.1...v1.0.2) (2025-12-06)


### Bug Fixes

* run lint/test in sync workflow and report check status to PR ([371d28f](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/371d28ff922fef12045b75c39ac6b149afdbf4ad))

## [1.0.1](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.0...v1.0.1) (2025-12-06)


### Bug Fixes

* add workflow_dispatch to CI workflow for manual triggering ([3dd529f](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/3dd529fa94a39a9a9ec5a0429ac1ce9fc2ef9b86))

# 1.0.0 (2025-12-06)


### Bug Fixes

* add explicit permissions and token config for semantic-release ([7fa9c9f](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/7fa9c9f6f306a8226a0501a9915212dc7e0726c2))
* add permissions to CI workflow for status checks ([5fa6d77](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/5fa6d779fca8750674724b252b79049818f02fb7))
* add required permissions for push and issue creation in sync workflow ([56f54cc](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/56f54cc387303639e9364fb36dfb2fcd9a12016b))
* correct merge conflict detection logic in sync workflow ([e61d83c](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/e61d83c58f0f6df8b4631365d9e95a75f73c84ba))
* improve merge conflict detection using exit code and unmerged files ([4e5ff16](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/4e5ff165f4a2267a4d372017b5c12d123f6f60fd))
* resolve pnpm version conflict in workflows and add main-to-dev sync ([7eecedd](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/7eecedd8fd312771a32a1472d7a79a9648549a76))
* update sync workflow to create PR instead of direct push ([1267890](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/126789056e469cee39a911fde4ae2b36787b2b29))


### Features

* support PAT for semantic-release to bypass branch protection ([64ffc92](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/64ffc922386be05fa7743a65c4dbddb26d794f51))
* sync workflow runs after release completes and attempts auto-merge ([b51bfe5](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/b51bfe5e4702dcb0b62c56d7315210c7b0acc389))
