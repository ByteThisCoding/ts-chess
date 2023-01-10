import { ChessBoardState } from "../board-state/chess-board-state";
import { ChessCell, ChessPosition } from "../position/chess-position";
import { ChessPlayer } from "../enums";
import { ChessBoardSingleMove } from "../moves/chess-board-move";
import { ChessPiece } from "../pieces/chess-piece";
import { KingPiece } from "../pieces/king";
import { KnightPiece } from "../pieces/knight";
import { PawnPiece } from "../pieces/pawn";
import { RookPiece } from "../pieces/rook";
import {
    ChessNotationParseFailure,
    ChessNotationParseStatus,
} from "./chess-notation-parse-status";

/**
 * Utility for converting a move to notation and a notation to a move object
 */
export class ChessNotation {
    /**
     * Convert a string such as "Nxg4" to a move
     * This will ignore notation about captures, checks, and checkmates
     * and let the game engine fill in those blanks
     *
     * TODO: better error handling for this and helper methods
     */
    public static moveFromNotation(
        boardState: ChessBoardState,
        notation: string
    ): ChessNotationParseStatus {
        notation = notation.trim();

        const movePlayer =
            boardState.getLastMove()?.player === ChessPlayer.white
                ? ChessPlayer.black
                : ChessPlayer.white;

        // special case: castle, verify both pieces are in correct positions
        if (notation === "O-O" || notation === "O-O-O") {
            return this.parseCastleMove(boardState, notation, movePlayer);
        }

        // special case: only 2 chars, it's a simple pawn move with no capture
        if (notation.length === 2) {
            return this.parseSimplePawnMove(boardState, notation, movePlayer);
        }

        notation = notation.replace("x", "").replace("+", "").replace("#", "");
        const isPawnPromotion = notation.indexOf("=") > -1;
        const promotionLetter = notation.substring(notation.indexOf("=") + 1);

        if (isPawnPromotion) {
            notation = notation.substring(0, notation.indexOf("="));
        }

        let pieceLetter = "";
        let fromPos: ChessCell;
        let toPos: ChessCell;

        let piece: ChessPiece;

        // 3 = simple move, such as
        if (notation.length === 3) {
            pieceLetter = notation.substring(0, 1).toLocaleLowerCase();
            const pos = notation.substring(1, 3);
            toPos = ChessPosition.fromString(pos);

            // see which piece can make this move
            const possibleMoves =
                boardState.getPossibleMovesForPlayer(movePlayer);
            
            let numPiecesFound = 0;
            let fromMove: ChessBoardSingleMove | null = null;
            for (const move of possibleMoves.getMoves()) {
                //console.log(move.toString());
                if (
                    move.toPosition === toPos &&
                    move.pieceMoved.letter.toLocaleLowerCase() === pieceLetter
                ) {
                    piece = move.pieceMoved;
                    fromMove = move;

                    // only increment if it's a different piece
                    if (
                        numPiecesFound === 0 ||
                        !fromMove.pieceMoved.equals(move.pieceMoved)
                    ) {
                        numPiecesFound++;
                    }

                    // if it's ambiguous, return such a status
                    if (numPiecesFound > 1) {
                        return new ChessNotationParseStatus(
                            false,
                            null,
                            ChessNotationParseFailure.pieceAmbiguous
                        );
                    }
                }
            }

            if (!fromMove) {
                return new ChessNotationParseStatus(
                    false,
                    null,
                    ChessNotationParseFailure.pieceNotFound
                );
            }

            fromPos = fromMove.fromPosition;
            piece = fromMove.pieceMoved;
        } else {
            // if there's a missing letter, it's a pawn move, add the letter for convenience
            if (notation.length === 4) {
                notation = PawnPiece.letter.toUpperCase() + notation;
            }

            pieceLetter = notation.substring(0, 1).toLocaleLowerCase();
            const posFrom = notation.substring(1, 3);
            const posTo = notation.substring(3);

            fromPos = ChessPosition.fromString(posFrom);
            toPos = ChessPosition.fromString(posTo);

            piece = boardState.getPieceAtPosition(fromPos)!;
        }

        if (!piece) {
            return new ChessNotationParseStatus(
                false,
                null,
                ChessNotationParseFailure.pieceNotFound,
                {
                    fromPos,
                }
            );
        } else if (piece.letter.toLocaleLowerCase() !== pieceLetter) {
            return new ChessNotationParseStatus(
                false,
                null,
                ChessNotationParseFailure.pieceDesignationIncorrect,
                {
                    fromPos,
                }
            );
        }

        const toPiece = boardState.getPieceAtPosition(toPos);
        const [fromPosCol, fromPosRow] = ChessPosition.cellToColRow(fromPos);
        const [toPosCol, toPosRow] = ChessPosition.cellToColRow(toPos);

        // special case: en passant
        let enPassant = false;
        // the only way it can move columns without stepping into an existing piece is if it is en passant
        if (
            piece.letter === PawnPiece.letter &&
            !toPiece &&
            toPosCol !== fromPosCol
        ) {
            enPassant = true;
        }

        return new ChessNotationParseStatus(
            true,
            new ChessBoardSingleMove(
                movePlayer,
                piece,
                fromPos,
                toPos,
                false,
                enPassant,
                isPawnPromotion,
                promotionLetter
            ),
            null
        );
    }

    /**
     * Parse if kingside or queenside castle
     * This checks against the board state to see if the pieces are in the correct positions
     */
    private static parseCastleMove(
        boardState: ChessBoardState,
        notation: string,
        movePlayer: ChessPlayer
    ): ChessNotationParseStatus {
        if (notation === "O-O-O") {
            // queenside castle
            const row = movePlayer === ChessPlayer.white ? 1 : 8;
            const rookPos = ChessPosition.get(1, row);
            const rook = boardState.getPieceAtPosition(rookPos);
            if (!rook || !(rook.letter === RookPiece.letter)) {
                return new ChessNotationParseStatus(
                    false,
                    null,
                    ChessNotationParseFailure.pieceNotFound
                );
            }

            const kingPos = ChessPosition.get(5, row);
            const king = boardState.getPieceAtPosition(kingPos);
            if (!king || !(king.letter === KingPiece.letter)) {
                return new ChessNotationParseStatus(
                    false,
                    null,
                    ChessNotationParseFailure.pieceNotFound
                );
            }

            return new ChessNotationParseStatus(
                true,
                new ChessBoardSingleMove(
                    movePlayer,
                    king,
                    kingPos,
                    rookPos,
                    true
                ),
                null
            );
        } else {
            // kingside castle
            const row = movePlayer === ChessPlayer.white ? 1 : 8;
            const rookPos = ChessPosition.get(8, row);
            const rook = boardState.getPieceAtPosition(rookPos);
            if (!rook || !(rook.letter === RookPiece.letter)) {
                return new ChessNotationParseStatus(
                    false,
                    null,
                    ChessNotationParseFailure.pieceNotFound
                );
            }

            const kingPos = ChessPosition.get(5, row);
            const king = boardState.getPieceAtPosition(kingPos);
            if (!king || !(king.letter === KingPiece.letter)) {
                return new ChessNotationParseStatus(
                    false,
                    null,
                    ChessNotationParseFailure.pieceNotFound
                );
            }

            return new ChessNotationParseStatus(
                true,
                new ChessBoardSingleMove(
                    movePlayer,
                    king,
                    kingPos,
                    rookPos,
                    true
                ),
                null
            );
        }
    }

    /**
     * Parse a simple pawn move, such as "h3"
     *
     * TODO: add case where more than one non-pawn can move to the same square
     */
    private static parseSimplePawnMove(
        boardState: ChessBoardState,
        notation: string,
        movePlayer: ChessPlayer
    ): ChessNotationParseStatus {
        const inc = movePlayer === ChessPlayer.white ? 1 : -1;
        const pos = ChessPosition.fromString(notation);
        const posPiece = boardState.getPieceAtPosition(pos);

        if (posPiece) {
            return new ChessNotationParseStatus(
                false,
                null,
                ChessNotationParseFailure.illegalMove,
                {
                    pos,
                    posPiece,
                }
            );
        }

        // check which pawn is making this move
        const [posCol, posRow] = ChessPosition.cellToColRow(pos);
        const prevPos = ChessPosition.get(posCol, posRow - inc);
        const prevPosPiece = boardState.getPieceAtPosition(prevPos);

        if (prevPosPiece) {
            if (!(prevPosPiece.letter === PawnPiece.letter)) {
                return new ChessNotationParseStatus(
                    false,
                    null,
                    ChessNotationParseFailure.illegalMove,
                    {
                        pos,
                        posPiece,
                    }
                );
            } else {
                // this is a valid move
                return new ChessNotationParseStatus(
                    true,
                    new ChessBoardSingleMove(
                        movePlayer,
                        prevPosPiece,
                        prevPos,
                        pos
                    ),
                    null
                );
            }
        } else if (
            (movePlayer === ChessPlayer.white && posRow === 4) ||
            (movePlayer === ChessPlayer.black && posRow === 5)
        ) {
            // see if this is a double move from start
            // check middle row
            const midRow = movePlayer === ChessPlayer.white ? 2 : 7;
            const midPos = ChessPosition.get(posCol, midRow);
            const midPosPiece = boardState.getPieceAtPosition(midPos);
            if (midPosPiece) {
                if (!(midPosPiece.letter === PawnPiece.letter)) {
                    return new ChessNotationParseStatus(
                        false,
                        null,
                        ChessNotationParseFailure.illegalMove,
                        {
                            pos,
                            posPiece,
                        }
                    );
                } else {
                    // this is a valid move
                    return new ChessNotationParseStatus(
                        true,
                        new ChessBoardSingleMove(
                            movePlayer,
                            midPosPiece,
                            midPos,
                            pos
                        ),
                        null
                    );
                }
            } else {
                return new ChessNotationParseStatus(
                    false,
                    null,
                    ChessNotationParseFailure.pieceNotFound,
                    {
                        pos,
                        posPiece,
                    }
                );
            }
        } else {
            return new ChessNotationParseStatus(
                false,
                null,
                ChessNotationParseFailure.pieceNotFound,
                {
                    pos,
                    posPiece,
                }
            );
        }
    }

    /**
     * Convert a move on a board to chess notation
     * This does not validate if the move is valid
     */
    public static convertMoveToNotation(
        boardState: ChessBoardState,
        move: ChessBoardSingleMove
    ): string {
        const movePiece = move.pieceMoved;
        const [col, row] = ChessPosition.cellToColRow(move.toPosition);

        // special case, castle
        if (move.isCastle) {
            return col === 1 ? "O-O-O" : "O-O";
        }

        const isCapture =
            boardState.hasPieceAtPosition(move.toPosition) || move.isEnPassant;

        let gameState = "";
        // make the move on a cloned board, then check the board state
        const clonedBoard = boardState.clone();
        clonedBoard.setPiecesFromMove(move.clone(), "");

        if (clonedBoard.isGameInCheck()) {
            gameState = clonedBoard.isGameInCheckmate() ? "#" : "+";
        }

        const notationParts = {
            piece: movePiece.letter,
            fromPosition: "", // if piece's position is needed to disambiguate
            captures: isCapture ? "x" : "",
            toPosition: ChessPosition.toString(move.toPosition),
            promotion: "", //if a pawn is promoted, letter goes here
            gameState, //+, #
        };

        // if movePiece is pawn, remove "p" from notation
        if (movePiece.letter === PawnPiece.letter) {
            notationParts.piece = "";

            if (move.isPromotion) {
                notationParts.promotion =
                    "=" + move.promoteToPieceLetter.toUpperCase();
            }

            if (isCapture) {
                notationParts.fromPosition = ChessPosition.toString(
                    move.fromPosition
                );
            }
        }

        // add position if ambiguous
        const possibleMoves = boardState
            .getPossibleMovesForPlayer(move.player)
            .getMovesForPieceType(move.pieceMoved);
        let secondFound = false;
        for (const searchMove of possibleMoves) {
            if (
                move.toPosition === searchMove.toPosition &&
                !move.equals(searchMove)
            ) {
                secondFound = true;
                break;
            }
        }
        if (secondFound) {
            notationParts.fromPosition = ChessPosition.toString(
                move.fromPosition
            );
        }

        return `${notationParts.piece}${notationParts.fromPosition}${notationParts.captures}${notationParts.toPosition}${notationParts.promotion}${notationParts.gameState}`;
    }
}
