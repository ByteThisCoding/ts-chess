import readline from "readline";
import { ChessAiHeuristic } from "./src/ai/heuristic/heuristic";
import { ChessAiSortHeuristic } from "./src/ai/heuristic/sort-heuristic";
import { ChessNegamaxAiPlayer } from "./src/ai/negamax-ai/ai";
import { ChessBoardState } from "./src/game-logic/board-state/chess-board-state";
import { ChessGame } from "./src/game-logic/chess-game";
import { ChessPlayer } from "./src/game-logic/enums";
import { ChessBoardSingleMove } from "./src/game-logic/moves/chess-board-move";
import { ChessNotation } from "./src/game-logic/notation/chess-notation-parser";
import { ChessPosition } from "./src/game-logic/position/chess-position";
import { logProfileMap } from "./src/util/method-profiler";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Simple game loop to play from console input
 */
RunGame();

async function RunGame() {
    const game = new ChessGame();
    //await loopNoAi(game);
    await loopOneAi(game);
    //await loopTwoAis(game);

    console.log(printGameCheckmatePieces(game.getCurrentBoardState()));

    console.log(
        "Moves:",
        game
            .getBoardStateHistory()
            .getListOfMovesNotation()
            .map((mv, ind) => `${ind}: ${mv}`)
            .join("\n")
    );

    process.exit(0);
}

/**
 * If we're not playing an AI game, get all inputs from user
 */
async function loopNoAi(game: ChessGame) {
    const heuristic = new ChessAiHeuristic();
    console.log(game.getBoardStateHistory().getBoardState().toStringDetailed());

    while (!game.isGameOver()) {
        try {
            const move = await requestChessMove(
                game.getBoardStateHistory().getBoardState()
            );

            if (!move) {
                break;
            }

            game.makeMove(move);
            console.log(
                game.getBoardStateHistory().getBoardState().toStringDetailed()
            );
            console.log(
                "________________________",
                heuristic.getScore(game.getBoardStateHistory().getBoardState(), -Infinity, true)
            );
        } catch (err) {
            console.log(`There was a problem with that move.`, err);
        }
    }
    console.log("Game over!");
}

/**
 * Human vs AI
 */
async function loopOneAi(game: ChessGame) {
    const playerColor = await requestPlayerColor();
    //const heuristic = new ChessAiHeuristic({ "relativePiecesScore": 0.3565, "pinSkewerScore": 0.0985, "threateningScore": 0.08000000000000002, "passedPawnScore": 0.11699999999999998, "activatedScore": 0.03249999999999999, "centerControlScore": 0.08, "mobilityScore": 0.1525, "stackedPawnScore": 0.083 });
    /*const heuristic = new ChessAiHeuristic({
        "relativePiecesScore": 0.5362038461538461,
        "pinSkewerScore": 0.09336538461538462,
        "threateningScore": 0.06973076923076922,
        "passedPawnScore": 0.077384,
        "activatedScore": 0.031188461538461538,
        "centerControlScore": 0.04992307692307692,
        "mobilityScore": 0.09567692307692307,
        "stackedPawnScore": 0.0464
    });*/
    //const heuristic = new ChessAiHeuristic({"relativePiecesScore":0.907,"passedPawnScore":0,"pinSkewerScore":0.0029999999999999923,"threateningScore":0.07099999999999998,"activatedScore":0.004,"mobilityScore":0.002,"centerControlScore":0.004,"stackedPawnScore":0.009});
    //const heuristic = new ChessAiHeuristic({"relativePiecesScore":0.7321249999999999,"pinSkewerScore":0.058625,"threateningScore":0.056749999999999995,"passedPawnScore":0.02275,"activatedScore":0.024875,"centerControlScore":0.021124999999999998,"mobilityScore":0.02375,"stackedPawnScore":0.060000000000000005});
    const heuristic = new ChessAiHeuristic({
        relativePiecesScore: 0.62225,
        passedPawnScore: 0.005999999999999998,
        pinSkewerScore: 0.03174999999999999,
        threateningScore: 0.1865,
        activatedScore: 0.019250000000000003,
        mobilityScore: 0.006500000000000001,
        centerControlScore: 0.02075,
        stackedPawnScore: 0.10700000000000001,
    });

    //const heuristic = new ChessAiHeuristic();
    const aiPlayer = new ChessNegamaxAiPlayer(
        heuristic,
        //new ChessAiSortHeuristic()
        heuristic
    );

    // if player is not first, have AI move first
    if (playerColor === ChessPlayer.black) {
        const aiMove = await aiPlayer.determineNextMove(
            game.getBoardStateHistory().getBoardState()
        );

        if (!aiMove) {
            console.log("AI Resigns!");
            return;
        }

        game.makeMove(aiMove);
        console.log(
            game.getBoardStateHistory().getBoardState().toStringDetailed()
        );
        /*console.log(
            "________________________",
            heuristic.getScore(game.getBoardStateHistory().getBoardState())
        );*/
    }

    while (!game.isGameOver()) {
        try {
            // get the player's move
            const move = await requestChessMove(
                game.getBoardStateHistory().getBoardState()
            );

            if (!move) {
                break;
            }
            
            game.makeMove(move);
            console.log(
                game.getBoardStateHistory().getBoardState().toStringDetailed()
            );
            /*console.log(
                "________________________",
                heuristic.getScore(game.getBoardStateHistory().getBoardState())
            );*/

            // get the AI's move
            if (!game.isGameOver()) {
                const aiMove = await aiPlayer.determineNextMove(
                    game.getBoardStateHistory().getBoardState()
                );
                if (!aiMove) {
                    console.log("AI Resigns!");
                    return;
                }

                game.makeMove(aiMove);
                console.log(logProfileMap());
                console.log(
                    game
                        .getBoardStateHistory()
                        .getBoardState()
                        .toStringDetailed()
                );
                /*console.log(
                    "________________________",
                    heuristic.getScore(
                        game.getBoardStateHistory().getBoardState()
                    )
                );*/
            }
        } catch (err) {
            console.log(`There was a problem with that move.`, err);
        }
    }

    console.log("Game over!");
}

async function loopTwoAis(game: ChessGame) {
    const start = +new Date();
    console.log("Two AI players game has started");

    const heuristic = new ChessAiHeuristic();
    const aiPlayerWhite = new ChessNegamaxAiPlayer(
        /*new ChessAiHeuristic(),
        new ChessAiSortHeuristic()*/
        heuristic,
        heuristic
    );
    const aiPlayerBlack = new ChessNegamaxAiPlayer(
        /*new ChessAiHeuristic(),
        new ChessAiSortHeuristic()*/
        heuristic,
        heuristic
    );

    const repetitionMap = new Map<string, number>();

    while (!game.isGameOver()) {
        try {
            const aiMove = await aiPlayerWhite.determineNextMove(
                game.getBoardStateHistory().getBoardState()
            );
            if (!aiMove) {
                console.log("AI Resigns!");
                return;
            }

            game.makeMove(aiMove);
            console.log(
                game.getBoardStateHistory().getBoardState().toStringDetailed()
            );
            console.log("________________________");

            const boardStr = game
                .getBoardStateHistory()
                .getBoardState()
                .toString();
            repetitionMap.set(boardStr, (repetitionMap.get(boardStr) || 0) + 1);
            if (repetitionMap.get(boardStr)! > 3) {
                console.log("Game over due to repetition!");
                console.log("Time: ", +new Date() - start);
                return;
            }

            // get the AI's move
            if (!game.isGameOver()) {
                const aiMove = await aiPlayerBlack.determineNextMove(
                    game.getBoardStateHistory().getBoardState()
                );
                if (!aiMove) {
                    console.log("AI Resigns!");
                    return;
                }

                game.makeMove(aiMove);
                console.log(
                    game
                        .getBoardStateHistory()
                        .getBoardState()
                        .toStringDetailed()
                );
                console.log("________________________");

                const boardStr = game
                    .getBoardStateHistory()
                    .getBoardState()
                    .toString();
                repetitionMap.set(
                    boardStr,
                    (repetitionMap.get(boardStr) || 0) + 1
                );
                if (repetitionMap.get(boardStr)! > 3) {
                    console.log("Game over due to repetition!");
                    console.log("Time: ", +new Date() - start);
                    return;
                }
            }

            await Promise.resolve();
        } catch (err) {
            console.log(`There was a problem with that move.`, err);
            process.exit(0);
        }
    }

    console.log("Time: ", +new Date() - start);
    console.log("Game over!");
}

/**
 * Parse from chess move notation
 */
async function requestChessMove(
    boardState: ChessBoardState
): Promise<ChessBoardSingleMove | null> {
    while (true) {
        const currentPlayer =
            boardState.getLastMove()?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;
        const notation = await requestInput(
            `Please enter the move you'd like to make for ${currentPlayer} in chess notation:`
        );

        if (notation === "quit") {
            return null;
        }

        const parseStatus = ChessNotation.moveFromNotation(
            boardState,
            notation
        );
        if (parseStatus.success) {
            return parseStatus.move!;
        }

        console.log(
            "We had trouble reading your move: " + parseStatus.failureReason
        );
        console.log("Please try again.");
    }
}

/**
 * Check which color the player wants to play as
 */
async function requestPlayerColor(): Promise<ChessPlayer> {
    while (true) {
        const playerColor = await requestInput(`Do you want to play as White?`);
        switch (playerColor.toLocaleLowerCase().trim()) {
            case "y":
            case "yes":
                return ChessPlayer.white;
            case "n":
            case "no":
                return ChessPlayer.black;
        }

        // if none of those, re-request
        console.log(
            "Your input wasn't recognized. Please answer with yes or no."
        );
    }
}

/**
 * Wrapper for simplifying reading a line
 */
async function requestInput(question: string): Promise<string> {
    return new Promise((resolve, reject) => {
        rl.question(question + "\n :: ", (res) => {
            console.log("--> " + res);
            resolve(res);
        });
    });
}

function printGameCheckmatePieces(boardState: ChessBoardState): void {
    let playerCheckmated: ChessPlayer;
    if (boardState.isPlayerInCheck(ChessPlayer.white)) {
        playerCheckmated = ChessPlayer.white;
    } else {
        playerCheckmated = ChessPlayer.black;
    }

    const moves = boardState.getPossibleMovesForPlayer(playerCheckmated);
    const kingPiece = boardState.getPlayerKingPiece(playerCheckmated);
    console.log(
        "Position of checkmated king: " +
            ChessPosition.toString(kingPiece.getPosition())
    );
    console.log("List of moves which attack the king:");
    for (const move of moves.getMoves()) {
        if (move.toPosition === kingPiece.getPosition()) {
            console.log(move.toString());
        }
    }
}
