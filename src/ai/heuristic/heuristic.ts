import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessPieceAvailableMoveSet } from "../../game-logic/moves/chess-piece-available-move-set";
import { BishopPiece } from "../../game-logic/pieces/bishop";
import { KingPiece } from "../../game-logic/pieces/king";
import { PawnPiece } from "../../game-logic/pieces/pawn";
import { ChessCell, ChessPosition } from "../../game-logic/position/chess-position";
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

        // TODO: passed pawn?
        
        // TODO: control of center (weight?)

        // TODO: doubled, blocked, or isolated pawns

        // TODO: forks, skewers, pins?

        // TODO: detract points for specific pieces which can't enter the game / have no power (such as trapped bishop?)

        const whitePossibleMovements = new ChessPieceAvailableMoveSet(ChessPlayer.white, boardState);
        const blackPossibleMovements = new ChessPieceAvailableMoveSet(ChessPlayer.black, boardState)

        let relativePiecesScore = 0;
        //let smotheredScore = 0;

        // adjust so knights are worth more when activated until a bishop is activated
        let activationScore = 0;

        // prefer positions where your pieces aren't being threatened
        let threatenedScore = 0;

        // control of the center
        const centerControlWhite = new Set<ChessCell>();
        const centerControlBlack = new Set<ChessCell>();

        for (const piece of boardState.getAllPieces()) {
            let inc = 0;
            const possibleMoves = boardState.getPossibleMovementsForPiece(piece);
            if (piece.player === ChessPlayer.white) {
                inc = 1;
                whitePossibleMovements.merge(possibleMoves);
            } else {
                inc = -1;
                blackPossibleMovements.merge(possibleMoves);
            }

            relativePiecesScore += inc * piece.pointsValue;

            if (piece.getIsActivated()) {
                if (piece instanceof BishopPiece) {
                    activationScore += 1.25*inc;
                } else if (piece instanceof KingPiece) {
                    activationScore += 1.1*inc;
                } else if (piece instanceof PawnPiece) {
                    activationScore += 1*inc;
                }
            }

            // for each of its possible moves, if it threatens a piece, add to score
            for (const move of possibleMoves.getMoves()) {
                const pieceAtPos = boardState.getPieceAtPosition(move.toPosition);
                // add some score for threatening
                if (pieceAtPos && pieceAtPos.player !== piece.player) {
                    threatenedScore += inc*pieceAtPos.pointsValue;
                }

                // check if has a line in the center
                switch (move.toPosition) {
                    case ChessPosition.get(4, 4):
                    case ChessPosition.get(4, 5):
                    case ChessPosition.get(5, 4):
                    case ChessPosition.get(5, 5):
                        if (move.player === ChessPlayer.white) {
                            centerControlWhite.add(move.toPosition);
                        } else {
                            centerControlBlack.add(move.toPosition);
                        }
                        break;
                }
            }
        }

        // add up
        const centerControl = centerControlWhite.size - centerControlBlack.size;

        // the longer a piece isn't activated, the worse off the player is, so adjust
        activationScore *= 0.2*boardState.getMoveNumber();

        // general mobility score, how many moves can we make?
        const mobilityScore = whitePossibleMovements.getNumMoves() - blackPossibleMovements.getNumMoves();

        return 1*relativePiecesScore
            + 0.2*threatenedScore
            + 0.15*activationScore
            //+ 0.1*centerControl
            + 0.1*mobilityScore;
    }

}
