import { iChessAiHeuristicDataPoints } from "../models/heuristic-data-point";
import { ChromosomePopulation } from "./population";

export class HeuristicWeightsOptimizer {

    /**
     * Have multiple AIs compete to find the optimal heuristic weights
     */
    findOptimalWeights(populationSize: number, numGenerations: number): iChessAiHeuristicDataPoints<number>[] {
        // run this algorithm for a preset number of generations
        // TODO: instead, detect an emerging winner and use instead
        let population = new ChromosomePopulation(populationSize);
        for (let i = 0; i < numGenerations; i++) {
            console.log(`---------------------- Generation ${i} --------------------------`);
            this.logGeneration(population);
            console.log("");
            console.log("Best chromosome found so far: ", population.getBestChromosomes().map(ch => ch.toString()));
            console.log("");
            population = population.reproduce();
        }

        console.log(`---------------------- Generation ${numGenerations} --------------------------`);
        this.logGeneration(population);
        console.log("");
        console.log("");
        console.log("Best chromosome found at the end: ", population.getBestChromosomes().map(ch => ch.toString()));
        console.log("");

        return population.getBestChromosomes().map(ch => ch.weights);
    }

    private logGeneration(population: ChromosomePopulation): void {
        for (const chromosome of population.getCurrentPopulation()) {
            console.log(chromosome?.toString());
        }
    }

}