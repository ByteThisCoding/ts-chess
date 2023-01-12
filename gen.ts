/**
 * Find an optimal heuristic weight
 */

import { HeuristicWeightsOptimizer } from "./src/ai/genetic-algorithm/heuristic-weights";

const POPULATION_SIZE = 16;
const NUM_GENERATIONS = 9;

const optimalWeights = new HeuristicWeightsOptimizer().findOptimalWeights(POPULATION_SIZE, NUM_GENERATIONS);
console.log("----------------------- Optimal Weights Found --------------------------");
console.log(JSON.stringify(optimalWeights, null, 4));