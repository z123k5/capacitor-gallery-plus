# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.0.5] - 2025-01-30
### Changed
- Improved example project with better media handling for Web and native platforms.
- Refined platform-specific logic to enhance performance.

## [0.0.4] - 2025-01-30

### Added
- Implemented **photo selection in Web** using `showDirectoryPicker`.
- Web support now properly reads images and retrieves metadata.

### Fixed
- **iOS date format** now returns a correct timestamp in milliseconds.
- **iOS width & height calculation** now returns the correct original dimensions instead of the thumbnail size.

### Improved
- General stability and performance improvements for media retrieval.

## [0.0.3] - 2025-01-30

### Added
- 🚀 Introduced a new **Ionic/Angular example project** for easier plugin usage.


## [0.0.2] - 2025-01-29
### Added
- Implemented `getMedias` function for iOS.
- Added support for filtering media by type (`image`, `video`, `all`).
- Added sorting options (`newest`, `oldest`).
- Added optional flags for additional media details (`includeDetails`, `includeBaseColor`).
- Implemented base color extraction for images.
- Implemented permission handling (`checkPermissions`, `requestPermissions`).

### Fixed
- Fixed TypeScript issues related to `createdAt` sorting in Web implementation.
- Fixed missing function references for dominant color extraction.
- Improved compatibility with older iOS versions.

### Changed
- Refactored iOS implementation to handle `PHPhotoLibrary` authorization correctly.
- Updated rollup configuration to properly generate ESM, CJS, and IIFE builds.

## [0.0.1] - 2025-01-28
### Added
- Initial implementation of `getMediaFiles()`
- Basic Capacitor plugin setup for iOS & Android
- README, LICENSE, and project structure
- First functional beta release
- Implemented `echo()` function
- Basic Capacitor plugin structure
