/**
 * Find an optimal heuristic weight
 */

import { HeuristicWeightsOptimizer } from "./src/ai/genetic-algorithm/heuristic-weights";

const POPULATION_SIZE = 32;
const NUM_GENERATIONS = 18;

const optimalWeights = new HeuristicWeightsOptimizer().findOptimalWeights(
    POPULATION_SIZE,
    NUM_GENERATIONS,
    [
        // initial manual weights
        {
            relativePiecesScore: 0.7,
            pinSkewerScore: 0.1,
            threateningScore: 0.06,
            passedPawnScore: 0.04,
            activatedScore: 0.03,
            centerControlScore: 0.02,
            mobilityScore: 0.04,
            stackedPawnScore: 0.01,
        },
        // tentative result from previous population runs
        {
            relativePiecesScore: 0.013000000000000012,
            passedPawnScore: 0.19399999999999995,
            pinSkewerScore: 0.097,
            threateningScore: 0.10000000000000003,
            activatedScore: 0.034999999999999976,
            mobilityScore: 0.265,
            centerControlScore: 0.14,
            stackedPawnScore: 0.156,
        },
    ]
);
console.log(
    "----------------------- Optimal Weights Found --------------------------"
);
console.log(JSON.stringify(optimalWeights, null, 4));
