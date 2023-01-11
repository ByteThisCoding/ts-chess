import { ChessBoardState } from "../../game-logic/board-state/chess-board-state";
import { ChessPlayer } from "../../game-logic/enums";
import { ChessPieceAvailableMoveSet } from "../../game-logic/moves/chess-piece-available-move-set";
import { BishopPiece } from "../../game-logic/pieces/bishop";
import { ChessPiece } from "../../game-logic/pieces/chess-piece";
import { KingPiece } from "../../game-logic/pieces/king";
import { KnightPiece } from "../../game-logic/pieces/knight";
import { PawnPiece } from "../../game-logic/pieces/pawn";
import { QueenPiece } from "../../game-logic/pieces/queen";
import { RookPiece } from "../../game-logic/pieces/rook";
import {
    ChessCell,
    ChessPosition,
} from "../../game-logic/position/chess-position";
import {
    iChessAiHeuristic,
    iChessAiHeuristicEvaluation,
} from "../models/heuristic";
import { HeuristicDataPoint } from "./heuristic-data-point";

// TODO: higher score for skewer / pin w/ king

export class ChessAiHeuristic implements iChessAiHeuristic {
    private maxPiecePoints =
        PawnPiece.pointsValue * 8 +
        BishopPiece.pointsValue * 2 +
        KnightPiece.pointsValue * 2 +
        RookPiece.pointsValue * 2 +
        QueenPiece.pointsValue;

    // TODO: genetic algorithm or manually adjust values
    private dataPoints = {
        // the relative value of each piece score
        relativePiecesScore: new HeuristicDataPoint(0.7, this.maxPiecePoints),
        // score based on if player is threatening with a skewer (TODO: max value of 2)
        pinSkewerScore: new HeuristicDataPoint(0.1, 2),
        // score based on what each player is threatening
        threateningScore: new HeuristicDataPoint(0.06, this.maxPiecePoints),
        // passed pawn score
        passedPawnScore: new HeuristicDataPoint(0.04, 8),
        // activation score
        activatedScore: new HeuristicDataPoint(
            0.03,
            // 1.25 for bishop, 1.15 for knight, 1 for pawn
            1.25 * 2 + 1.15 * 2 + 1 * 2
        ),
        // control of center
        centerControlScore: new HeuristicDataPoint(0.02, 16),
        // mobility
        mobilityScore: new HeuristicDataPoint(
            0.05,
            40 //TODO: find better value
        ),
        // doubled pawns?
    };

    /**
     * TODO: add more criteria
     */
    getScore(boardState: ChessBoardState): iChessAiHeuristicEvaluation {
        if (boardState.isGameInCheckmate()) {
            return {
                score: boardState.isPlayerInCheckmate(ChessPlayer.white)
                    ? -Number.MAX_SAFE_INTEGER
                    : Number.MAX_SAFE_INTEGER,
                data: {},
            };
        }

        // reset values
        for (const key in this.dataPoints) {
            // @ts-ignore
            this.dataPoints[key].value = 0;
        }

        const whitePossibleMovements = new ChessPieceAvailableMoveSet(
            ChessPlayer.white,
            boardState
        );
        const blackPossibleMovements = new ChessPieceAvailableMoveSet(
            ChessPlayer.black,
            boardState
        );

        // control of the center
        const centerControlWhite = new Set<ChessCell>();
        const centerControlBlack = new Set<ChessCell>();

        // iterate over all pieces and assemble data points
        for (const piece of boardState.getAllPieces()) {
            let inc = 0;
            const possibleMoves =
                boardState.getPossibleMovementsForPiece(piece);
            if (piece.player === ChessPlayer.white) {
                inc = 1;
                whitePossibleMovements.merge(possibleMoves);
            } else {
                inc = -1;
                blackPossibleMovements.merge(possibleMoves);
            }

            if (piece.letter !== KingPiece.letter) {
                this.dataPoints.relativePiecesScore.value +=
                    inc * piece.pointsValue;
            }

            // adjust score to represent activated pieces, we favor bishops > knights > pawns
            if (piece.getIsActivated()) {
                switch (piece.letter) {
                    case BishopPiece.letter:
                        this.dataPoints.activatedScore.value += 1.25 * inc;
                        break;
                    case KnightPiece.letter:
                        this.dataPoints.activatedScore.value += 1.1 * inc;
                        break;
                    case PawnPiece.letter:
                        this.dataPoints.activatedScore.value += 1 * inc;
                        break;
                }
            }

            // if it's a pawn, check if it's passed
            if (piece.letter === PawnPiece.letter) {
                let isPassed = true;
                const [col, row] = ChessPosition.cellToColRow(
                    piece.getPosition()
                );
                // check rows in front
                for (
                    let checkRow = row + inc;
                    isPassed && checkRow > 0 && checkRow < 9;
                    checkRow += inc
                ) {
                    const checkPos = ChessPosition.get(col, checkRow);
                    const checkPiece = boardState.getPieceAtPosition(checkPos);
                    if (checkPiece?.letter === PawnPiece.letter) {
                        isPassed = false;
                        break;
                    }
                }

                if (!isPassed) {
                    this.dataPoints.passedPawnScore.value += inc;
                }
            }

            // check threats
            for (const move of possibleMoves.getMoves()) {
                const pieceAtPos = boardState.getPieceAtPosition(
                    move.toPosition
                );
                // add some score for threatening
                if (pieceAtPos && pieceAtPos.player !== piece.player) {
                    // this shouldn't be considered a threat of the piece under attack can capture this one
                    const pieceAtPosPossibleMoves =
                        boardState.getPossibleMovementsForPiece(pieceAtPos);
                    if (
                        !pieceAtPosPossibleMoves.hasMoveToPosition(
                            move.toPosition
                        )
                    ) {
                        this.dataPoints.threateningScore.value +=
                            inc * pieceAtPos.pointsValue;
                    }
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

            // use shadow moves to check skewers and pins
            for (const move of possibleMoves.getShadowMoves()) {
                const existingPiece = boardState.getPieceAtPosition(
                    move.toPosition
                );
                if (existingPiece) {
                    const blockingPiece = move.blockingPiece;

                    // ensure blocking piece can't capture the original one
                    if (!boardState.getPossibleMovementsForPiece(blockingPiece).hasMoveToPosition(move.pieceMoved.getPosition())) {
                        // we should only increment if the threatened piece doesn't have the power to take original piece
                        this.dataPoints.pinSkewerScore.value += inc;
                    }
                }
            }
        }

        // add up
        this.dataPoints.centerControlScore.value =
            centerControlWhite.size - centerControlBlack.size;

        // the longer a piece isn't activated, the worse off the player is, so adjust
        this.dataPoints.activatedScore.value *=
            0.2 * boardState.getMoveNumber();

        // general mobility score, how many moves can we make?
        this.dataPoints.mobilityScore.value =
            whitePossibleMovements.getNumMoves() -
            blackPossibleMovements.getNumMoves();

        let totalScore = 0;
        let data: any = {};
        for (const key in this.dataPoints) {
            const datapoint = (this.dataPoints as any)[
                key
            ] as HeuristicDataPoint;
            data[key] = {
                value: datapoint.value,
                norm: datapoint.getNorm(),
                weight: datapoint.weight,
            };
            totalScore += datapoint.getNorm() * datapoint.weight;
        }
        return {
            score: totalScore,
            data,
        };
    }
}
