# [1.2.0](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.1.2...v1.2.0) (2026-02-02)


### Bug Fixes

* format GoogleSheetsService code ([1dd9d5c](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/1dd9d5c25e9737d8f173411e4493bb1b54d8c782))


### Features

* add Curated Reading sheet with standalone books and series filtering ([6af90ec](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/6af90ecb205caf584aedd704e24227a6b203cc1f)), closes [#1](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/1)

## [1.1.2](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.1.1...v1.1.2) (2025-12-07)


### Bug Fixes

* remove unused [@ts-expect-error](https://github.com/ts-expect-error) directives in pathResolver ([1fce2b1](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/1fce2b1e905950292d0d93282dc7f34fca777994))

## [1.1.1](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.1.0...v1.1.1) (2025-12-07)


### Bug Fixes

* remove duplicate 'with' key and add workflow_dispatch to build-executables ([5869888](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/586988871b71d170dba06faaf3734a5d3520d974))

# [1.1.0](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.8...v1.1.0) (2025-12-07)


### Features

* add series progression timeline feature ([e8c7a07](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/e8c7a077f7dd34cd2277b9881bb3b69e9dac4187))

## [Unreleased]

### Features

* add series progression timeline feature with visual display in CLI and GUI
* enhance active series detection to include incomplete series for better prioritization
* improve GUI timeline display to show book titles alongside book numbers
* add intelligent path resolution for resource files in Electron GUI

### Bug Fixes

* fix completion percentage calculation to use total books tracked instead of highest book number
* fix path resolution for client_secret.json in Electron GUI development mode
* improve series filtering to exclude completed series from timeline
* fix book grouping logic to handle gaps and non-sequential book numbers correctly
* handle books without explicit book numbers in series (e.g., Alex Cross books 1-2)
* detect missing series books that don't have series information in title (e.g., The Mephisto Club)

## [1.0.8](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.0.7...v1.0.8) (2025-12-07)


### Bug Fixes

* use release tag version and build arm64 for macOS ([f41d93b](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/f41d93bb5b555e4cf7713d9b179d0236cf6da019))

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
