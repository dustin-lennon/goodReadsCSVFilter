## [1.7.10](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.9...v1.7.10) (2026-07-02)


### Bug Fixes

* filter stale versioned artifacts when copying from temp build dir ([#164](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/164)) ([1e13818](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/1e13818327e6c89fc0d628495505f051bde11917)), closes [#163](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/163)
* **timeline:** apply LLM series overrides before processing books ([#168](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/168)) ([c635faf](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/c635faf9bf174ea72b8cac877db1081c1a731fa3)), closes [#164](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/164) [#165](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/165) [#163](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/163) [#167](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/167)

## [1.7.9](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.8...v1.7.9) (2026-06-29)


### Bug Fixes

* filter stale versioned artifacts when copying from temp build dir ([#164](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/164)) ([#165](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/165)) ([f853c82](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/f853c828964c0c6b0b697c13cd2488bd1bddf112)), closes [#163](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/163)

## [1.7.8](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.7...v1.7.8) (2026-06-29)


### Bug Fixes

* **llm:** include author in series detection prompt ([eb05348](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/eb05348eadcafbce1627a741ba3be3816f122ee9)), closes [#158](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/158)

## [1.7.7](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.6...v1.7.7) (2026-06-16)


### Bug Fixes

* redirect electron-builder output to APFS temp dir on ExFAT volumes ([cd742d4](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/cd742d41a8a3e7448c267e2e10e276f513fbc1d2))

## [1.7.6](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.5...v1.7.6) (2026-06-13)


### Bug Fixes

* file dialog opens behind window and stale CSV cache after Process Another File ([29cf159](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/29cf15959e9626b44ffcfb87cc7252964e49c9f3)), closes [#145](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/145)

## [1.7.5](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.4...v1.7.5) (2026-06-08)


### Bug Fixes

* render markdown and preserve newlines in Book Chat user messages ([f38a007](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/f38a007e1ab7c9fc21ed7c6bb4a74ed572470861)), closes [#141](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/141)

## [1.7.4](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.3...v1.7.4) (2026-06-07)


### Bug Fixes

* force --no-ff merge in sync-main-to-dev to avoid [skip ci] head commit ([f40c0a6](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/f40c0a6d9e902a58d7a83034553e7d9b06d8b8c7)), closes [#126](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/126) [#122](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/122) [#132](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/132) [#136](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/136) [#137](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/137)

## [1.7.3](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.2...v1.7.3) (2026-06-07)


### Bug Fixes

* use PAT instead of GITHUB_TOKEN in sync-main-to-dev so CI triggers ([360246b](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/360246b49c3339521b79c2fe81f35f1180aeb3be)), closes [#133](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/133)

## [1.7.2](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.1...v1.7.2) (2026-06-07)


### Bug Fixes

* restore scrolling for content taller than the window ([44dfac2](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/44dfac223f86f2736c2917b3fd0594d1fea4c8b3)), closes [#124](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/124) [hi#priority](https://github.com/hi/issues/priority) [#127](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/127)

## [1.7.1](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.7.0...v1.7.1) (2026-06-07)


### Bug Fixes

* center main window content and size window to fit without scrolling ([696149f](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/696149f7444d35db70909ce596f0bbe520e18733)), closes [#123](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/123)

# [1.7.0](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.6.0...v1.7.0) (2026-06-07)


### Features

* add typing indicator while waiting for AI Book Chat response ([73cb512](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/73cb51212a4e545e1b5512537a48208fdd510d07)), closes [#119](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/119)

# [1.6.0](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.5.0...v1.6.0) (2026-06-07)


### Features

* surface friendly error messages for Anthropic billing/auth/rate-limit failures ([89af370](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/89af3702c3fe1356d7c2d40d38fa861e23d6b726)), closes [#116](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/116)

# [1.5.0](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.4.1...v1.5.0) (2026-06-07)


### Features

* render markdown in AI book chat responses ([65f0f83](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/65f0f83a79101ff4cb92baf197cb57885e9f1f63)), closes [#105](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/105)

## [1.4.1](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.4.0...v1.4.1) (2026-06-07)


### Bug Fixes

* bump build-executables actions and fix release tag input ([#97](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/97)) ([6d2ea99](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/6d2ea99b41a569d1cad8c99bee835a450b3a962a)), closes [softprops/action-#release](https://github.com/softprops/action-/issues/release) [softprops/action-#release](https://github.com/softprops/action-/issues/release)

# [1.4.0](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.11...v1.4.0) (2026-06-07)


### Bug Fixes

* stop sync-main-to-dev from aborting merge before committing conflicts ([95b7fbc](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/95b7fbc32cba0fb70424670ca89029fda6c11393))
* stop sync-main-to-dev from aborting merge before committing conflicts ([#93](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/93)) ([66cd121](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/66cd1219076c834d76fee54b96f8129eb4735135))
* tighten book chat system prompts to prevent topic drift ([#89](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/89)) ([019a983](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/019a9831b6ed5745b4b3cd4752e32026e8423a52)), closes [#74](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/74) [#73](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/73)


### Features

* AI series detection, book chat/journal, multi-user Google support ([#85](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/85)) ([cf7a3b6](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/cf7a3b6394a9ae1658c806a3d09b49a34009bfcf)), closes [#74](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/74) [#73](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/73)

## [1.3.11](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.10...v1.3.11) (2026-06-06)


### Bug Fixes

* disable electron-builder npm rebuild for pnpm compatibility ([1ba9eb1](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/1ba9eb19e2d294fbce837217c443d110e2d6cce8))

## [1.3.10](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.9...v1.3.10) (2026-06-05)


### Bug Fixes

* series with decimal book numbers missing from timeline and weighting ([#81](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/81)) ([14d68ed](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/14d68ed160d9a62177e8b95512de87d5a63c679b)), closes [#74](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/74) [#73](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/73)

## [1.3.9](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.8...v1.3.9) (2026-06-05)


### Bug Fixes

* reading-next book advances active series pointer for correct weighting ([59e775e](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/59e775ecf7f3653a677c14d05761e6efdc5278cd)), closes [#8](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/8) [#9](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/9) [#10-15](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/10-15)

## [1.3.8](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.7...v1.3.8) (2026-06-05)


### Bug Fixes

* skip cjk bracket-format titles from series tracking ([#74](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/74)) ([0ccf7f1](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/0ccf7f1a231af00ef197405e75be6102dcd243ce)), closes [#73](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/73)

## [1.3.7](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.6...v1.3.7) (2026-06-04)


### Bug Fixes

* replace peter-evans/create-pull-request in sync workflow ([2168051](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/21680515a9e52b7a6f72708420c8080d031f12da))

## [1.3.6](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.5...v1.3.6) (2026-06-04)


### Bug Fixes

* detect vol. and japanese bracket series title formats ([#71](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/71)) ([a5287fb](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/a5287fb2550002fc74ba9347bc1674f1a8bd5ed3)), closes [#70](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/70)

## [1.3.5](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.4...v1.3.5) (2026-06-04)


### Bug Fixes

* pass --publish never flag to electron-builder cli ([#68](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/68)) ([d52b6b9](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/d52b6b977024cba585bf91326ed6107dd4c35c1e)), closes [#67](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/67)

## [1.3.4](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.3...v1.3.4) (2026-06-04)


### Bug Fixes

* disable electron-builder auto-publish to github ([#66](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/66)) ([68acc25](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/68acc2543fc21156c777ebce8ddb6a42d07bb3b7)), closes [softprops/action-#release](https://github.com/softprops/action-/issues/release) [#65](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/65)

## [1.3.3](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.2...v1.3.3) (2026-06-04)


### Bug Fixes

* csv caching and progressive series weighting ([#62](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/62)) ([79f6ee0](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/79f6ee012fcb2f96ffc949843dc42d1f763bf83c)), closes [#61](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/61)

## [1.3.2](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.1...v1.3.2) (2026-02-28)


### Bug Fixes

* progressive series detection with suffixes ([a5f5f29](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/a5f5f295a7b478969775a9c762c4aada7d582a0e)), closes [#54](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/54) [#55](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/55) [#1](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/1)

## [1.3.1](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.3.0...v1.3.1) (2026-02-28)


### Bug Fixes

* use writable path for token.json in packaged Electron app ([eaaab0c](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/eaaab0ca4eb68e87440db778953bd33a99e9fd2d))

# [1.3.0](https://github.com/dustin-lennon/goodReadsCSVFilter/compare/v1.2.0...v1.3.0) (2026-02-28)


### Bug Fixes

* configure dev branch as prerelease in semantic-release ([73730b7](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/73730b743bd5fae0470abeaed7de344f82c2bd01))
* disable npm publishing in semantic-release ([09cd2ab](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/09cd2ab5da51bb258a2ca4476ddf9e1c3ae1d870))
* eslint configuration for test files ([c59cddd](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/c59cddd26d50b5304cef5abf2c5db3a1d41a2674))
* eslint configuration for test files ([0a72c67](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/0a72c6719d39c066054d54ff7fa6b3afbe2b27a3))
* oauth callback detection and progressive series filtering ([f173769](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/f1737697db3d16e8b0789c41b0ffbc1da0f0ed3c)), closes [#1](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/1) [#1](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/1)
* oauth callback detection and progressive series filtering ([c1dd089](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/c1dd0898f93c8cbadf6e4b56796bc09ddd365928)), closes [#1](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/1) [#1](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/1)
* remove duplicate 'with' key in build-executables workflow ([1f02c29](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/1f02c29083e8c59d054dfd9787850b90f08bb4e0))
* remove environment requirement from release workflow ([a9ffcf7](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/a9ffcf711813817107c14f69a26e21623501917d))


### Features

* add Progressive series support for light novel reading order ([0cea0e4](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/0cea0e47c0efbcaee9ca44ccdf14e7f4d78b4a46)), closes [#2](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/2)
* add Progressive series support for light novel reading order ([160a449](https://github.com/dustin-lennon/goodReadsCSVFilter/commit/160a4494212512336dff2651ef07c86977d53ec4)), closes [#2](https://github.com/dustin-lennon/goodReadsCSVFilter/issues/2)

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
