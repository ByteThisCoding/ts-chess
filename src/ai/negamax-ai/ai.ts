import { WorkerFacade } from "../../worker/worker";
import { WorkerFactory } from "../../worker/worker-factory";
import { iChessAiPlayer } from "../models/chess-ai.model";
import { AI_WORKER_MESSAGES } from "./ai-worker-messages";
import { ChessBoardState } from "../../game-logic/board-state/chess-board-state.model";
import { ChessBoardSingleMove } from "../../game-logic/moves/chess-board-move.model";
import { ChessBoardMoveDeserializer } from "../../game-logic/moves/chess-board-move-deserializer";

export class ChessNegamaxAiPlayer implements iChessAiPlayer {

    private workers: WorkerFacade[] = [];
    private NUM_WORKERS = 1;

    constructor() {
        for (let i = 0; i < this.NUM_WORKERS; i++) {
            this.workers[i] = WorkerFactory.getWorker(
                '/src/ai/negamax-ai/ai-worker.js'
            );
        }
    }

    async determineNextMove(boardState: ChessBoardState): Promise<{
        move: ChessBoardSingleMove | null,
        score: number
    }> {
        const workerPromises: Promise<{
            move: ChessBoardSingleMove | null;
            score: number;
        }>[] = [];
        for (let i=0; i<this.workers.length; i++) {
            const worker = this.workers[i];

            workerPromises.push(new Promise((resolve, reject) => {
                let workerDone = false;
                worker.onMessage(AI_WORKER_MESSAGES.completeSearch, (data: any) => {
                    if (workerDone) {
                        return;
                    }

                    workerDone = true;
                    resolve({
                        move: ChessBoardMoveDeserializer.deserialize(data.move),
                        score: data.score
                    });
                });

                worker.postMessage(AI_WORKER_MESSAGES.startSearch, {
                    board: boardState.serialize(),
                    nth: i,
                    numWorkers: this.workers.length
                });
            }));
        }

        const foundMoves = await Promise.all(workerPromises);
        // find the best move score
        const bestMoveScore = foundMoves.reduce((bestScore, {move, score}) => {
            return Math.max(score, bestScore);
        }, -Infinity);

        const bestMoves = foundMoves.filter(({score}) => score === bestMoveScore);

        return bestMoves[
            Math.floor(Math.random() * bestMoves.length)
        ];
    }
}