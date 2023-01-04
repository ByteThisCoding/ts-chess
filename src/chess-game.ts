import { ChessBoardSingleMove } from "./moves/chess-board-move";
import { ChessBoardStateHistory } from "./board-state/chess-board-state-history";
import { ChessMoveValidator } from "./moves/chess-move-validator";
import { ChessPlayer } from "./enums";

export class ChessGame {
    
    private boardStateHistory = new ChessBoardStateHistory();
    private currentPlayer: ChessPlayer = ChessPlayer.white;

    getCurrentPlayerToMove(): ChessPlayer {
        return this.currentPlayer;
    }

    getBoardStateHistory(): ChessBoardStateHistory {
        return this.boardStateHistory;
    }

    /**
     * Attempt to make a move, throw an error if the move is invalid
     */
    makeMove(move: ChessBoardSingleMove): void {
        // check if current player is valid
        if (this.currentPlayer !== move.player) {
            throw new Error(`Wrong player made a move.`);
        }

        // validate
        const moveStatus = ChessMoveValidator.isMoveValid(
            this.boardStateHistory.getCurrentBoardState(),
            move
        );
        if (!moveStatus.success) {
            console.error(`Error making move: `, {
                failure: moveStatus.failureReason,
                data: moveStatus.additionalData
            });
            throw new Error(
                "The selected move is invalid: " + moveStatus.failureReason
            );
        }

        // make move if valid
        this.boardStateHistory.registerMove(move);

        // update current player
        if (this.currentPlayer === ChessPlayer.black) {
            this.currentPlayer = ChessPlayer.white;
        } else {
            this.currentPlayer = ChessPlayer.black;
        }
    }
}
