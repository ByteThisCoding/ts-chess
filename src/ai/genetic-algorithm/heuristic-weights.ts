import { ChessGame } from "../../game-logic/chess-game";
import {
    iChessAiHeuristicDataPoint,
    iChessAiHeuristicDataPoints,
} from "../models/heuristic-data-point.model";
import { Chromosome } from "./chromosome";
import { ChromosomePopulation } from "./population";

export class HeuristicWeightsOptimizer {
    /**
     * Have multiple AIs compete to find the optimal heuristic weights
     */
    findOptimalWeights(
        populationSize: number,
        numGenerations: number,
        initialWeights?: iChessAiHeuristicDataPoints<number>[]
    ): iChessAiHeuristicDataPoints<number> {
        // run this algorithm for a preset number of generations
        // TODO: instead, detect an emerging winner and use instead
        const initialChromosomes = (initialWeights || []).map(
            (wt) => new Chromosome(wt)
        );
        let population = new ChromosomePopulation(
            populationSize,
            initialChromosomes
        );
        for (let i = 0; i < numGenerations; i++) {
            console.log(
                `---------------------- Generation ${i} --------------------------`
            );
            this.logGeneration(population);
            console.log("");
            console.log(
                "Best chromosome found so far: ",
                population.getBestChromosomes().map((ch) => ch.toString())
            );
            console.log("");
            population = population.reproduce();
        }

        console.log(
            `---------------------- Generation ${numGenerations} --------------------------`
        );
        this.logGeneration(population);
        console.log("");
        console.log("");
        console.log(
            "Best chromosome found at the end: ",
            population.getBestChromosomes().map((ch) => ch.toString())
        );
        console.log("");

        console.log(
            "------------------> Final Tournament <---------------------"
        );
        return this.getTournamentWinner(population.getCurrentPopulation())
            .weights;
    }

    /**
     * When we have the final generation, have a final tournament
     */
    private getTournamentWinner(population: Chromosome[]): Chromosome {
        // base case, we have a winner
        if (population.length === 1) {
            return population[0];
        }

        // otherwise, compete
        ChromosomePopulation.shuffleArray(population);
        const playerA = population[0];
        const playerB = population[1];

        // play two games
        const winnerOne = ChromosomePopulation.playGame(playerA, playerB);
        const winnerTwo = ChromosomePopulation.playGame(playerB, playerA);

        let totalWinner: Chromosome | null = null;
        // if draw, pick the one with the most wins
        if (winnerOne === winnerTwo) {
            if (winnerOne) {
                totalWinner = winnerOne;
            } else {
                // random selection (since random already, just pick A)
                totalWinner = playerA;
            }
        } else if (winnerOne) {
            totalWinner =
                winnerOne.numGamesPlayed > (winnerTwo?.numGamesPlayed || 0)
                    ? winnerOne
                    : winnerTwo;
        } else if (winnerTwo) {
            totalWinner = winnerTwo;
        } else {
            // random selection (since random already, just pick A)
            totalWinner = playerA;
        }

        // slice the winner from the population
        if (totalWinner === playerA) {
            population = population.slice(1);
        } else {
            population = [...population.slice(0, 1), ...population.slice(2)];
        }

        return this.getTournamentWinner(population);
    }

    private logGeneration(population: ChromosomePopulation): void {
        for (const chromosome of population.getCurrentPopulation()) {
            console.log(chromosome?.toString());
        }
    }
}
