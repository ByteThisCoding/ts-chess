import { ChessBoardStateImpl } from "../../../public-api";
import { WorkerBootstrapper } from "../../worker/worker-bootstrapper";
import { ChessAiHeuristic } from "../heuristic/heuristic";
import { ChessAiDifficultyMode, ChessNegamaxAiAlgorithm } from "./ai-algorithm";
import { AI_WORKER_MESSAGES } from "./ai-worker-messages";

/**
 * This is a worker thread for the AI
 */
console.log("[AiWorker] script started");
const workerListener = new WorkerBootstrapper();
workerListener.onMessage(AI_WORKER_MESSAGES.startSearch, async (data: {board: string; nth: number; numWorkers: number}) => {
    const heuristic = new ChessAiHeuristic({
        relativePiecesScore: 0.7,
        pinSkewerScore: 0.1,
        threateningScore: 0.06,
        passedPawnScore: 0.04,
        activatedScore: 0.03,
        centerControlScore: 0.02,
        mobilityScore: 0.04,
        stackedPawnScore: 0.01,
    });

    const ai = new ChessNegamaxAiAlgorithm(
        // TODO: make a factory
        heuristic,
        heuristic,
        ChessAiDifficultyMode.ultra,
        data.nth,
        data.numWorkers
    );

    console.log(`[AiWorker] starting search on worker ${data.nth + 1} of ${data.numWorkers}`);
    console.log("..", data.board);
    /*const board = ChessBoardStateImpl.deserialize(data.board);

    const move = await ai.determineNextMove(board);
    console.log(`[AiWorker] completed search on worker ${data.nth + 1} of ${data.numWorkers}`, move.toString());

    // TODO: return move depth, not just move
    workerListener.postMessage(AI_WORKER_MESSAGES.completeSearch, move);*/
});
