import readline from "readline";
import { ChessAiHeuristic } from "./src/ai/heuristic/heuristic";
import { ChessAiSortHeuristic } from "./src/ai/heuristic/sort-heuristic";
import { ChessMinimaxAiPlayer } from "./src/ai/minimax-ai/ai";
import { ChessBoardState } from "./src/game-logic/board-state/chess-board-state";
import { ChessGame } from "./src/game-logic/chess-game";
import { ChessPlayer } from "./src/game-logic/enums";
import { ChessBoardSingleMove } from "./src/game-logic/moves/chess-board-move";
import { ChessNotation } from "./src/game-logic/notation/chess-notation-parser";
import { ChessPosition } from "./src/game-logic/position/chess-position";

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
            game.makeMove(move);
            console.log(
                game.getBoardStateHistory().getBoardState().toStringDetailed()
            );
            console.log(
                "________________________",
                heuristic.getScore(game.getBoardStateHistory().getBoardState())
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
    const heuristic = new ChessAiHeuristic();
    const aiPlayer = new ChessMinimaxAiPlayer(
        heuristic,
        new ChessAiSortHeuristic()
    );

    // if player is not first, have AI move first
    if (playerColor === ChessPlayer.black) {
        const aiMove = aiPlayer.determineNextMove(
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
        console.log(
            "________________________",
            heuristic.getScore(game.getBoardStateHistory().getBoardState())
        );
    }

    while (!game.isGameOver()) {
        try {
            // get the player's move
            const move = await requestChessMove(
                game.getBoardStateHistory().getBoardState()
            );
            game.makeMove(move);
            console.log(
                game.getBoardStateHistory().getBoardState().toStringDetailed()
            );
            console.log(
                "________________________",
                heuristic.getScore(game.getBoardStateHistory().getBoardState())
            );

            // get the AI's move
            if (!game.isGameOver()) {
                const aiMove = aiPlayer.determineNextMove(
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
                console.log(
                    "________________________",
                    heuristic.getScore(
                        game.getBoardStateHistory().getBoardState()
                    )
                );
            }
        } catch (err) {
            console.log(`There was a problem with that move.`, err);
        }
    }

    console.log("Game over!");
}

async function loopTwoAis(game: ChessGame) {
    console.log("Two AI players game has started");

    const aiPlayerWhite = new ChessMinimaxAiPlayer(
        new ChessAiHeuristic(),
        new ChessAiSortHeuristic()
    );
    const aiPlayerBlack = new ChessMinimaxAiPlayer(
        new ChessAiHeuristic(),
        new ChessAiSortHeuristic()
    );

    const repetitionMap = new Map<string, number>();

    while (!game.isGameOver()) {
        try {
            const aiMove = aiPlayerWhite.determineNextMove(
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
                return;
            }

            // get the AI's move
            if (!game.isGameOver()) {
                const aiMove = aiPlayerBlack.determineNextMove(
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
                    return;
                }
            }

            await Promise.resolve();
        } catch (err) {
            console.log(`There was a problem with that move.`, err);
            process.exit(0);
        }
    }

    console.log("Game over!");
}

/**
 * Parse from chess move notation
 */
async function requestChessMove(
    boardState: ChessBoardState
): Promise<ChessBoardSingleMove> {
    while (true) {
        const currentPlayer =
            boardState.getLastMove()?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;
        const notation = await requestInput(
            `Please enter the move you'd like to make for ${currentPlayer} in chess notation:`
        );
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
