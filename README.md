# DRISHTI-PAT

DRISHTI-PAT is a browser-based virtual testbed for coarse pointing, acquisition, and tracking (PAT) of a moving optical beacon for Free Space Optical Communication (FSOC). It simulates target motion, camera pointing, target detection, tracking, and selected environmental effects, then presents the simulation as live telemetry and visual dashboards.

The project is a software simulation and algorithm prototype. It does not connect to a physical camera or gimbal, and it does not currently ingest recorded video or perform image-based computer vision on a rendered focal-plane image.

## Contents

- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Using the App](#using-the-app)
- [Simulation Model](#simulation-model)
- [PS-4 Reference Data](#ps-4-reference-data)
- [Telemetry and Exports](#telemetry-and-exports)
- [Project Structure](#project-structure)
- [Technology and Commands](#technology-and-commands)
- [Current Limitations](#current-limitations)

## Requirements

- Node.js 20.19+ or 22.12+ (the project uses Vite 8)
- npm
- A modern browser with Canvas 2D support
- Internet access is needed to load the Google Fonts referenced by `index.html`; the app can otherwise run with browser fallback fonts if those fonts are unavailable.

## Quick Start

From the project root:

```sh
npm install
npm run dev
```

Vite prints a local URL, normally `http://localhost:5173/`.

To create and serve a production build:

```sh
npm run build
npm run preview
```

Available scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload. |
| `npm run build` | Run the TypeScript project build, then create the production bundle in `dist/`. |
| `npm run preview` | Serve the most recent production build locally. Run `npm run build` first. |
| `npm run lint` | Run Oxlint over the project. |

## Using the App

The application opens on Mission Control and starts the simulation automatically. The header contains a scenario selector, transport controls, simulation time, live lock/error/confidence/seed indicators, and navigation tabs.

### Transport and keyboard controls

| Action | Control |
| --- | --- |
| Run or pause | Header Run/Pause button, or `Space` when focus is not in an input/select. |
| Reset | Header Reset button, or `R`. Resets the engine using the current configuration. |
| Advance one frame | Header Step button, or `S`. The button is enabled while paused. Advances by approximately 0.033 seconds. |
| Select a scenario | Preset selector in the header. Loading a preset applies its configuration and resets the simulation. |

Editing a configuration value also resets the simulation engine with the updated configuration. The Apply & Reset Engine button in Config resets the current run.

### Views

| View | What it shows |
| --- | --- |
| **Mission Control** | Tactical azimuth/elevation map with target, camera field of view, trail, and optional decoys; synthetic sensor-viewfinder with detection/prediction reticles; lock and algorithm status; live Rytov, vibration, and cloud-occlusion controls. |
| **Config** | Target motion and beacon settings; gimbal/FOV/latency settings; controller selection; atmospheric and vibration settings; decoys; seed and replay settings. The panel separates PS reference values from configurable proposals. |
| **Analytics** | Run summary, angular-error/confidence/motor-velocity plots, CSV telemetry export, and a JSON performance report with the PS-4 source and criteria. |
| **Events** | Chronological simulation event log with text search and severity filtering. Event types include search initialization, detection, lock acquisition/loss, occlusion, reacquisition, and decoy rejection. |
| **Stability** | Controls for switching between PID and Kalman Predictive modes. The displayed mode trade-off figures are illustrative copy, not a measured side-by-side experiment. |
| **Benchmarks** | Five challenge configurations covering nominal motion, scintillation, decoys, cloud occlusion, and extreme dynamics. Applying a challenge returns to Mission Control. |
| **3D Dashboard** | Canvas-rendered globe-style attitude visualization with live pan/tilt, pointing error, beacon match, scintillation, FOV, and lock state. This is a 2D canvas projection, not a Three.js scene or geographic Earth model. |
| **Architecture** | In-app overview of the intended pipeline and an assumptions/data-source table. Some explanatory labels are aspirational; see [Current Limitations](#current-limitations) for implemented behavior. |

### Configuration groups

The `SimulationConfig` interface in `src/types/fsoc.ts` defines the full configuration object. Presets and initial values are in `src/data/presets.ts`.

| Group | Fields and purpose |
| --- | --- |
| Camera reference | `screenSizePx`, `cameraResolutionPx`, `cameraFovDeg`, and `cameraUpdateRateHz` describe the virtual scene and camera baseline. |
| Target | `trajectoryType`, `targetSizePx`, `initialTargetLocation`, `targetSpeedDegPerSec`, `initialAzimuthDeg`, and `initialElevationDeg` describe target motion and starting location. |
| Beacon | `beaconPowerMw`, `beaconWavelengthNm`, and `targetPulseFreqHz` store beacon parameters used by scenario configuration and parts of the decoy logic. |
| Gimbal and FOV | `panRangeDeg`, `tiltRangeDeg`, `maxMotorVelocityDegPerSec`, `maxMotorAccelDegPerSec2`, `cameraDelayMs`, `baseFovDeg`, `minFovDeg`, and `maxFovDeg` configure camera steering and zoom behavior. |
| Noise and atmosphere | `noiseType`, `noiseSaltPepperPct`, `noiseGaussianSd`, `cameraJitterPx`, `atmosphericCondition`, and `platformMotionAmpPx` capture PS-4 disturbance settings. Not every field is currently connected to the engine; see below. |
| Physical disturbances | `rytovIndex`, `platformVibrationAmpDeg`, `platformVibrationFreqHz`, `sensorNoiseDb`, `enableCloudOcclusion`, `occlusionIntervalSec`, and `occlusionDurationSec` control the modeled fading, vibration, angular measurement noise, and periodic occlusion. |
| Controller | `controlMode`, `pidKp`, `pidKi`, `pidKd`, `enableConfidenceGuidedSearch`, `enablePredictivePointing`, `enableAdaptiveFov`, `enableBeaconIdentityCheck`, and `enableLockHandoffRecovery` configure steering and prototype features. |
| Decoys and reproducibility | `decoys` is a list of `DecoyConfig` records; each has an ID, name, pulse frequency, wavelength, brightness ratio, angular offset, and speed multiplier. `randomSeed` controls repeatable pseudo-random simulation sequences. |

### Built-in presets

`src/data/presets.ts` defines six presets:

1. **ISRO Benchmark: Nominal Coarse Alignment**: PS-4 camera baseline and figure-eight target, with the nominal disturbance values disabled.
2. **10% Salt & Pepper Noise**: a labeled PS-4 noise scenario. The current engine does not yet apply salt-and-pepper pixels to an image.
3. **Fog & Low-Light Attenuation**: fog label, Gaussian-noise setting, and stronger scintillation. Atmospheric labels are configuration metadata; the engine models the configured scintillation, not image contrast/brightness changes.
4. **Max Jitter & Platform Motion**: high configured jitter and platform motion values. The engine currently does not apply those pixel-translation fields to a rendered image.
5. **Multi-Decoy Optical Discrimination**: adds two synthetic decoys to exercise pulse-frequency rejection.
6. **High-Dynamics Evasive Maneuvers**: a configurable, non-official chaotic trajectory proposal.

The Benchmarks view also has five independent challenge levels. These are progressive challenge configurations and are not the same list as the header presets.

## Simulation Model

The core loop is implemented by `src/engine/simulationEngine.ts` and advances one simulation step at a time:

1. Compute synthetic target ground truth from time, trajectory, speed, initial position, and seed.
2. Apply platform vibration, optional log-normal scintillation, and optional periodic cloud occlusion.
3. Test whether the target is inside the camera FOV, then create a noisy angular detection when visible.
4. Optionally check synthetic decoys and log rejected or false-lock events.
5. Predict and update target state with `KalmanTracker2D`; optionally predict ahead by the configured camera delay.
6. Update the lock state and event log, then command the gimbal through `CameraController`.
7. Record a `TelemetryPoint` containing target/camera positions, detection and prediction, error, confidence, lock state, disturbance state, and motor effort.

### Target motion

`src/engine/targetPhysics.ts` implements these trajectories:

- **Linear**: constant angular velocity along a fixed direction.
- **Circular**: deterministic circular motion with radius derived from a fixed angular path and configured speed.
- **Figure of eight**: paired sinusoidal azimuth/elevation motion.
- **Random**: deterministic piecewise-heading walk; the same seed and simulation time produce the same path.
- **Sinusoidal weave**, **orbital arc**, and **chaotic maneuver**: additional prototype trajectories.

The TypeScript type also declares `spiral` and `sinusoidal`, but these are not currently implemented in the target-motion switch or exposed in the selector. The PS-4 reference lists sinusoidal and spiral as optional motion patterns.

### Tracking and camera control

- `KalmanTracker2D` tracks azimuth, elevation, and their velocities, updates covariance, and produces a latency-horizon prediction and uncertainty estimate.
- `CameraController` queues steering commands by configured delay, limits motor velocity and acceleration, constrains pan/tilt range, and optionally changes FOV according to lock state and confidence.
- PID mode uses proportional, integral, and derivative terms. The other selected modes follow the non-PID proportional steering path; Kalman Predictive additionally uses the Kalman prediction in the simulation engine. Rule-Based does not yet have a separate controller implementation.
- Confidence-guided search uses an Archimedean spiral around the estimated target position when the target is not visible.
- The lock state can be `SEARCHING`, `ACQUIRING`, `LOCKED`, `OCCLUDED_COASTING`, `LOST`, or `HANDOFF`. Current transitions primarily use SEARCHING, ACQUIRING, LOCKED, and OCCLUDED_COASTING.

### Determinism and rendering

`SeededRandom` implements a Mulberry32 pseudo-random generator and Gaussian sampling. The target Random trajectory uses the configured seed as well. The simulation steps inside a browser animation-frame loop; canvas views read a mutable telemetry reference on each frame, while React text and history state are synchronized less frequently to reduce re-rendering.

Mission Control's tactical map and viewfinder, and the attitude dashboard, are visualizations of synthetic telemetry. They are not camera images and do not perform centroid extraction from pixels.

## PS-4 Reference Data

The supplied PDF describes **Problem Statement 4: Development of an AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile FSOC Terminals**. Its final page lists the dataset link as **NA**. Therefore the project contains the PDF's specification values, not a separate public video corpus or labeled tracking dataset.

The structured reference is maintained in `src/data/problemStatement4.ts` and is used for baseline configuration values, the gimbal speed slider range, and source/performance criteria in exported JSON reports.

| PS-4 item | Reference value |
| --- | --- |
| Minimum virtual screen | 2000 x 2000 pixels; user-defined size is allowed. |
| Camera | Monochrome focal-plane array; color is optional. |
| Camera resolution | 640 x 480 pixels; user-defined resolution is allowed. |
| Camera FOV | User-defined; default 4 x 3 degrees. |
| Camera update rate | At least 30 Hz. |
| Initial camera position | Center of the screen. |
| Target | Beacon spot; one target is mandatory and multiple targets are optional. |
| Target shape and size | User-defined shape, default square; 5-20 pixels per dimension, default 10 x 10. |
| Initial target location | User-defined; default random. |
| Required motion choices | At least four: straight line, circular, figure of eight, and random. |
| Optional motion choices | Spiral, sinusoidal, and user-defined. |
| Gimbal speed | User-defined pan and tilt, each 5-10 degrees/second; default 5 degrees/second. |
| Update interval | At least 20 Hz. |
| Performance criteria | Acquisition <= 2 s; tracking error <= 10 px; target loss < 5%; reacquisition <= 1 s; processing speed >= 20 FPS. |
| Disturbances | Salt-and-pepper noise around 10% of the image, Gaussian, and Poisson noise; noise SD up to 20 px; camera jitter up to +/-20 px/frame; clear, haze, fog, rain, or low light; platform motion up to +/-20 px/frame, linear by default. |

These are reference requirements, not a certification result. Several values are stored as baseline metadata but are not yet represented by a pixel-accurate sensor or checked against measured hardware/video performance.

## Telemetry and Exports

Each `TelemetryPoint` records:

- Simulation time and frame index.
- Ground-truth azimuth/elevation and camera pan/tilt.
- Detected and predicted azimuth/elevation, or `null` when there is no detection.
- Kalman uncertainty radius, angular pointing error in milliradians, and tracking error in pixels.
- Confidence, active FOV, lock state, and estimated target-loss percentage.
- Beacon ID match score and active beacon label.
- Vibration offsets, occlusion state, scintillation factor, active camera label, and motor effort.

The Analytics view offers two downloads:

- **CSV telemetry**: time, frame, target/camera coordinates, detections and predictions, angular pointing error, confidence, lock state, beacon match score, and active camera. The current CSV does not yet include every `TelemetryPoint` field, including pixel tracking error and target-loss percentage.
- **JSON performance report**: report timestamp, PS-4 source metadata and performance criteria, active configuration, summary metrics, and every fifth telemetry sample.

Metric caveats in the current implementation:

- Acquisition time is the elapsed simulation time to the first lock event; it remains `null` if no lock is acquired.
- Lock retention is accumulated locked simulation time divided by total simulation time. Per-frame target loss is its unlocked-time complement.
- Tracking error in pixels is derived from angular target-to-camera offset and configured sensor resolution/FOV; it is a simulation estimate, not image-centroid error.
- Average reacquisition time is currently a fixed placeholder of 1.2 seconds.
- Average processing FPS is currently a fixed placeholder of 30 FPS, not a measured wall-clock rate.
- Summary metrics do not currently produce an overall PS-4 pass/fail certification.

## Project Structure

```text
.
|-- index.html                    # Browser entry document and page metadata
|-- package.json                  # Dependencies and npm scripts
|-- vite.config.ts                # Vite, React, and Tailwind plugins
|-- public/                       # Static assets served as-is
|-- src/
|   |-- main.tsx                  # React root and global stylesheet entry
|   |-- App.tsx                   # App state, simulation loop, view selection
|   |-- App.css                   # Application-level styles
|   |-- index.css                 # Global styles and Tailwind import
|   |-- components/
|   |   |-- Header.tsx            # Preset selector, run controls, status, navigation
|   |   |-- MissionControl.tsx    # Tactical map, viewfinder, live controls
|   |   |-- ScenarioConfig.tsx    # Configuration categories and inputs
|   |   |-- AnalyticsView.tsx     # Metrics, charts, CSV and JSON exports
|   |   |-- EventReview.tsx       # Searchable/filterable event timeline
|   |   |-- StabilityView.tsx     # Controller mode comparison controls
|   |   |-- ChallengeGenerator.tsx # Five progressive challenge configurations
|   |   |-- Globe3DView.tsx        # Canvas-rendered attitude visualization
|   |   `-- ArchitectureView.tsx  # In-app architecture and assumptions table
|   |-- data/
|   |   |-- problemStatement4.ts  # Structured PS-4 values and provenance
|   |   `-- presets.ts            # Default config and scenario presets
|   |-- engine/
|   |   |-- simulationEngine.ts   # Simulation step, lock state, events, telemetry
|   |   |-- targetPhysics.ts      # Synthetic target and decoy trajectories
|   |   |-- cameraController.ts   # Gimbal steering, latency, limits, adaptive FOV
|   |   |-- kalmanTracker.ts      # 2D state estimate and search spiral
|   |   `-- seedRandom.ts         # Seeded pseudo-random and Gaussian samples
|   |-- types/
|   |   `-- fsoc.ts               # Configuration, telemetry, event, and preset types
|   `-- assets/                   # Imported images and template assets
|-- tsconfig*.json                # TypeScript project configuration
`-- README.md
```

## Technology and Commands

- **React 19** renders the application views.
- **TypeScript 6** defines application, simulation, and telemetry types.
- **Vite 8** serves the development build and bundles production assets.
- **Tailwind CSS 4** provides utility styling through the Vite plugin; `src/App.css` and `src/index.css` contain additional styles.
- **Lucide React** provides interface icons; **canvas-confetti** is available for UI effects.
- The visualizations use the browser's Canvas 2D API. No 3D, computer-vision, charting, or numerical simulation package is currently used.
- The page requests Inter and JetBrains Mono from Google Fonts in `index.html`.

## Current Limitations

- No physical camera, gimbal, or communication hardware integration.
- No file/video input path; the benchmark video-file evaluation described by PS-4 is not implemented.
- No rendered 640 x 480 pixel sensor image, image processing pipeline, or real centroiding. Detection is generated from synthetic target visibility and angular measurement noise.
- PS-4 image noise types, atmospheric contrast/brightness reduction, camera pixel jitter, platform pixel translation, camera update rate, and target size/power/wavelength are not all consumed by the simulation engine. They are represented in configuration or documentation but are not full sensor effects.
- Beacon identity checks and decoy rejection are simplified simulation logic, not FFT-based pulse analysis or wavelength-resolved optical detection.
- Reacquisition and FPS metrics are placeholders, and benchmark pass/fail evaluation is not implemented.
- The Architecture page describes the intended module decomposition; parts of its wording (for example FFT matching) are not present as actual signal-processing code.
- No automated test suite is configured in `package.json`; `npm run build` performs TypeScript checking and production bundling.

The project is suitable for interactive algorithm prototyping and visualization. Results should not be treated as measured camera performance or as evidence that all PS-4 acceptance criteria have been satisfied.
