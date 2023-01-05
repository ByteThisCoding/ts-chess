import readline from "readline";
import { ChessBoardState } from "./src/board-state/chess-board-state";
import { ChessGame } from "./src/chess-game";
import { ChessPlayer } from "./src/enums";
import { ChessBoardSingleMove } from "./src/moves/chess-board-move";
import { ChessNotationParseStatus } from "./src/notation/chess-notation-parse-status";
import { ChessNotation } from "./src/notation/chess-notation-parser";

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
    loopNoAi(game);
}

/**
 * If we're not playing an AI game, get all inputs from user
 */
async function loopNoAi(game: ChessGame) {
    console.log(game.getBoardStateHistory().getCurrentBoardState().toString());

    while (!game.isGameOver()) {
        try {
            const move = await requestChessMove(
                game.getBoardStateHistory().getCurrentBoardState()
            );
            game.makeMove(move);
            console.log(
                game.getBoardStateHistory().getCurrentBoardState().toString()
            );
            console.log("________________________");
        } catch (err) {
            console.log(`There was a problem with that move.`, err);
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
