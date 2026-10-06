/**
 * AI Trek Intelligence Module Entry Point
 * Location: lib/ai/index.ts
 *
 * Folder Structure:
 *  - lib/ai/guardian-detector.ts   -> Group separation, corridor deviation, inactivity detection
 *  - lib/ai/eta-predictor.ts       -> Kinematic & terrain-adjusted ETA & progress prediction
 *  - lib/ai/route-intelligence.ts  -> Topographic sectioning, bottleneck & risk analysis
 *  - lib/ai/recommender.ts         -> Multi-objective user preference matching & explainability
 *  - lib/ai/types.ts               -> Central TypeScript definitions & telemetry interfaces
 *
 * ARCHITECTURAL NOTE:
 * All four intelligence engines are modular and decoupled from UI.
 * They accept standard telemetry/dataset inputs and return structured results.
 * Each module contains clear hook points where pre-trained Neural Network / ML models
 * (e.g. ONNX runtime, PyTorch endpoints, or Scikit-learn regressors) can be substituted
 * without modifying UI components or database schemas.
 */

export * from "./types";
export * from "./guardian-detector";
export * from "./eta-predictor";
export * from "./route-intelligence";
export * from "./recommender";
