import { ChessGame } from "../../game-logic/chess-game";
import { ChessPlayer } from "../../game-logic/enums";
import { iChessAiPlayer } from "../models/chess-ai";
import { iChessAiHeuristicDataPoints } from "../models/heuristic-data-point";
import { ChessNegamaxAiPlayer } from "../negamax-ai/ai";
import { Chromosome } from "./chromosome";

/**
 * Responsible for generating populations and creating successive generations
 */
export class ChromosomePopulation {

    private population: Chromosome[];

    constructor(public readonly populationSize: number) {
        // this is easier if we have an even number
        populationSize = Math.ceil(populationSize / 2)*2;
        this.population = new Array(populationSize).fill(null).map(() => this.createRandomChromosome());
    }

    getCurrentPopulation(): Chromosome[] {
        return [...this.population];
    }

    /**
     * Get the chromosome with the best win-loss ratio
     */
    getBestChromosomes(): Chromosome[] {
        const bestScore = this.population.reduce((best, curr) => {
            if (curr.winLossRatio > best.winLossRatio) {
                return curr;
            }
            return best;
        });

        return this.population.filter(ch => Math.abs(ch.winLossRatio - bestScore.winLossRatio) < 0.1);
    }

    /**
     * Create the next generation based on games
     */
    reproduce(): ChromosomePopulation {
        const populationA = this.population.slice(0, Math.floor(this.population.length/2));
        const populationB = this.population.slice(Math.floor(this.population.length/2));

        // make random pairings from population A to population B
        // since entire array is randomly generated, we can just pick the ith entry of each population
        for (let i=0; i<populationA.length; i++) {
            const playerA = populationA[i].aiPlayer;
            const playerB = populationB[i].aiPlayer;

            // play two games, each one is white once and black once
            const winnerOne = this.playGame(playerA, playerB);
            if (winnerOne) {
                if (winnerOne === playerA) {
                    populationA[i].numGamesWon ++;
                    populationB[i].numGamesLost ++;
                } else {
                    populationA[i].numGamesLost ++;
                    populationB[i].numGamesWon ++;
                }
            }
            populationA[i].numGamesPlayed ++;
            populationB[i].numGamesPlayed ++;

            const winnerTwo = this.playGame(playerB, playerA);
            if (winnerTwo) {
                if (winnerTwo === playerA) {
                    populationA[i].numGamesWon ++;
                    populationB[i].numGamesLost ++;
                } else {
                    populationA[i].numGamesLost ++;
                    populationB[i].numGamesWon ++;
                }
            }
            populationA[i].numGamesPlayed ++;
            populationB[i].numGamesPlayed ++;
        }

        // sort by win / loss ratio
        const sortedPopulation = [...this.population].sort((a, b) => b.winLossRatio - a.winLossRatio);
        // truncate the lowest x% and ties
        const lowIndex = Math.floor(this.populationSize * 0.5); // TODO: make constant or configurable
        const lowIndexRatio = sortedPopulation[lowIndex].winLossRatio;

        // add in existing items which are better than that 0.5
        let newGeneration: Chromosome[] = [];
        let entryIndex: number;
        for (entryIndex=0; entryIndex<this.populationSize; entryIndex++) {
            if (sortedPopulation[entryIndex].winLossRatio > lowIndexRatio) {
                newGeneration.push(sortedPopulation[entryIndex]);
            }
        }

        // add some offspring
        const newChromosomes: Chromosome[] = [];
        for (let left=0; left<newGeneration.length / 2; left++) {
            for (let right=newGeneration.length - 1; right >= newGeneration.length/2; right--) {
                if (newGeneration[left] && newGeneration[right]) {
                    const newChromosome = Chromosome.makeOffspring(newGeneration[left], newGeneration[right]);
                    newChromosomes.push(newChromosome);
                }
            }
        }
        newGeneration = [...newGeneration, ...newChromosomes];

        // make random chromosomes to fill in the rest
        for (entryIndex = newGeneration.length; entryIndex<this.populationSize; entryIndex++) {
            newGeneration.push(this.createRandomChromosome());
        }

        this.shuffleArray(newGeneration);

        const newPopulation = new ChromosomePopulation(this.populationSize);
        newPopulation.population = newGeneration;
        return newPopulation;
    }

    /**
     * Play a game between two AI and return a reference to the winner
     */
    private playGame(whitePlayer: iChessAiPlayer, blackPlayer: iChessAiPlayer): iChessAiPlayer | null {
        const game = new ChessGame();
        let isStalemate = false;
        let isCheckmate = false;
        let resignedPlayer: iChessAiPlayer | null = null;
        let isRepetition = false;

        const repetionSet = new Map<string, number>();
        let currentPlayer = whitePlayer;

        console.log("-- Game Started --");

        while (!isStalemate && !isCheckmate && !isRepetition) {
            // have current player make move
            const nextMove = currentPlayer.determineNextMove(game.getCurrentBoardState());
            if (nextMove) {
                game.makeMove(nextMove);
            } else {
                resignedPlayer = currentPlayer;
                break;
            }

            if (game.getCurrentBoardState().isGameInCheckmate()) {
                isCheckmate = true;
                break;
            }
            if (game.getCurrentBoardState().isGameInStalemate()) {
                isStalemate = true;
                break;
            }

            // add to repetition set
            const repetitionKey = game.getCurrentBoardState().toString();

            repetionSet.set(
                repetitionKey,
                (repetionSet.get(repetitionKey) || 0) + 1
            );
            if (repetionSet.get(repetitionKey)! > 2) {
                isRepetition = true;
                break;
            }

            // update current player for next loop
            currentPlayer = currentPlayer === whitePlayer ? blackPlayer : whitePlayer;
        }

        console.log(`-- Game Over! ${isCheckmate ? "Checkmate" : ""}${isStalemate ? "Stalemate" : ""}${isRepetition ? "Repetition" : ""}${resignedPlayer ? "Resigned" : ""} --`);

        if (resignedPlayer) {
            return whitePlayer === resignedPlayer ? blackPlayer : whitePlayer;
        }

        if (isStalemate || isRepetition) {
            return null;
        }

        return game.getCurrentBoardState().isPlayerInCheckmate(ChessPlayer.white) ? blackPlayer : whitePlayer;
    }


    /**
     * Create a chromosome with random weights
     */
    private createRandomChromosome(): Chromosome {
        let weightRemaining = 1;

        // initialize with 0, then iterate and assign values
        const weights: iChessAiHeuristicDataPoints<number> = {
            relativePiecesScore: 0,
            passedPawnScore: 0,
            pinSkewerScore: 0,
            threateningScore: 0,
            activatedScore: 0,
            mobilityScore: 0,
            centerControlScore: 0,
            stackedPawnScore: 0
        };

        const weightKeys = Object.keys(weights);
        this.shuffleArray(weightKeys);

        for (let i=0; i<weightKeys.length - 1; i++) {
            // TODO: check if this introduces bias
            const value = weightRemaining - Math.round(Math.random()*weightRemaining*1000)/1000;
            weightRemaining -= value;
            // @ts-ignore
            weights[weightKeys[i]] = value;
        }

        // @ts-ignore
        weights[weightKeys[weightKeys.length - 1]] = weightRemaining;

        return new Chromosome(weights);
    }

    /**
     * Shuffle an array in place
     */
    private shuffleArray<T>(array: Array<T>): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }

}