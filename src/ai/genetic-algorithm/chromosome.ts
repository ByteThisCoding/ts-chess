import { ChessAiHeuristic } from "../heuristic/heuristic";
import { ChessAiSortHeuristic } from "../heuristic/sort-heuristic";
import { iChessAiPlayer } from "../models/chess-ai";
import { iChessAiHeuristicDataPoints } from "../models/heuristic-data-point";
import { ChessNegamaxAiPlayer } from "../negamax-ai/ai";

/**
 * A chromosome is an encapsulation of different weights which form an AI's heuristic
 */
export class Chromosome {
    public readonly aiPlayer: iChessAiPlayer;

    // keep track of number of games won and lost so we know when to remove a chromosome
    public numGamesWon = 0;
    public numGamesLost = 0;
    public numGamesPlayed = 0;

    get winLossRatio(): number {
        return this.numGamesLost + this.numGamesWon === 0
            ? 0
            : this.numGamesWon / (this.numGamesWon + this.numGamesLost);
    }

    constructor(public readonly weights: iChessAiHeuristicDataPoints<number>) {
        this.aiPlayer = new ChessNegamaxAiPlayer(
            new ChessAiHeuristic(weights),
            new ChessAiSortHeuristic()
        );
    }

    toString(): string {
        return JSON.stringify({
            weights: this.weights,
            winLossRatio: this.winLossRatio,
            numGames: this.numGamesPlayed,
        });
    }

    /**
     * Make an AI offspring that combines the weights of two parent offspring
     */
    public static makeOffspring(a: Chromosome, b: Chromosome): Chromosome {
        // programatically merge, then type cast (via any) and return
        const mergedWeights: any = {};
        for (const key in a.weights) {
            // @ts-ignore
            mergedWeights[key] = this.mergeWeight(
                // @ts-ignore
                a.weights[key],
                // @ts-ignore
                b.weights[key]
            );
        }
        return new Chromosome(mergedWeights);
    }

    /**
     * Given two weight values, create a third which is their combination (Avg)
     */
    private static mergeWeight(a: number, b: number): number {
        return (a + b) / 2;
    }
}
