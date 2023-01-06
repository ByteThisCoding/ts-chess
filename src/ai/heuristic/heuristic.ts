import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { PawnPiece } from "../../game-logic/pieces/pawn";
import { iChessAiHeuristic } from "../models/heuristic";

export class ChessAiHeuristic implements iChessAiHeuristic {
    /**
     * TODO: add more criteria
     */
    getScore(boardState: ChessBoardState): number {
        if (boardState.isGameInCheckmate()) {
            return boardState.isPlayerInCheckmate(ChessPlayer.white)
                ? -Infinity
                : Infinity;
        }

        const relativePiecesScore = boardState.getScore();
        const mobilityScore = boardState.getPossibleMovesForPlayer(ChessPlayer.white).getNumMoves()
            -   boardState.getPossibleMovesForPlayer(ChessPlayer.black).getNumMoves()
        
        // TODO: how many pieces are being threatened

        // TODO: control of center

        // TODO: doubled, blocked, or isolated pawns

        // TODO: forks, skewers, pins?

        return relativePiecesScore + 0.1*mobilityScore;
    }

}
