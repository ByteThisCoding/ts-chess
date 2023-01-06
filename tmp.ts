/***
 * Temporary file for testing
 */

import { ChessBoardSingleMove } from "./src/game-logic/moves/chess-board-move";
import { ChessGame } from "./src/game-logic/chess-game";
import { ChessPosition } from "./src/game-logic/position/chess-position";
import { ChessPlayer } from "./src//game-logic/enums";

const game = new ChessGame();

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(5, 2))!,
        ChessPosition.get(5, 2),
        ChessPosition.get(5, 4),
        false,
        false
    )
);

process.exit(0);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(5, 7))!,
        ChessPosition.get(5, 7),
        ChessPosition.get(5, 5),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 1))!,
        ChessPosition.get(7, 1),
        ChessPosition.get(6, 3),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(4, 7))!,
        ChessPosition.get(4, 7),
        ChessPosition.get(4, 6),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(6, 1))!,
        ChessPosition.get(6, 1),
        ChessPosition.get(3, 4),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(2, 8))!,
        ChessPosition.get(2, 8),
        ChessPosition.get(3, 6),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(6, 3))!,
        ChessPosition.get(6, 3),
        ChessPosition.get(5, 5),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(4, 6))!,
        ChessPosition.get(4, 6),
        ChessPosition.get(5, 5),
        false,
        false
    )
);

// castle
makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(5, 1))!,
        ChessPosition.get(5, 1),
        ChessPosition.get(8, 1),
        true,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(1, 8))!,
        ChessPosition.get(1, 8),
        ChessPosition.get(2, 8),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 2))!,
        ChessPosition.get(7, 2),
        ChessPosition.get(7, 4),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(1, 7))!,
        ChessPosition.get(1, 7),
        ChessPosition.get(1, 5),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 4))!,
        ChessPosition.get(7, 4),
        ChessPosition.get(7, 5),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(6, 7))!,
        ChessPosition.get(6, 7),
        ChessPosition.get(6, 5),
        false,
        false
    )
);

// en passant
makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 5))!,
        ChessPosition.get(7, 5),
        ChessPosition.get(6, 6),
        false,
        true
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(4, 8))!,
        ChessPosition.get(4, 8),
        ChessPosition.get(6, 6)
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(2, 1))!,
        ChessPosition.get(2, 1),
        ChessPosition.get(1, 3)
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(6, 6))!,
        ChessPosition.get(6, 6),
        ChessPosition.get(5, 7)
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(2, 2))!,
        ChessPosition.get(2, 2),
        ChessPosition.get(2, 3)
    )
);

// check
makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(5, 7))!,
        ChessPosition.get(5, 7),
        ChessPosition.get(7, 5)
    )
);

// invalid
/*makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(2, 3))!,
        ChessPosition.get(2, 3),
        ChessPosition.get(2, 4),
        false,
        true
    )
);*/

// move king to safety
makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 1))!,
        ChessPosition.get(7, 1),
        ChessPosition.get(8, 1),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(8, 7))!,
        ChessPosition.get(8, 7),
        ChessPosition.get(8, 5),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(1, 1))!,
        ChessPosition.get(1, 1),
        ChessPosition.get(2, 1),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(1, 5))!,
        ChessPosition.get(1, 5),
        ChessPosition.get(1, 4),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(4, 2))!,
        ChessPosition.get(4, 2),
        ChessPosition.get(4, 3),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(1, 4))!,
        ChessPosition.get(1, 4),
        ChessPosition.get(2, 3),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(3, 4))!,
        ChessPosition.get(3, 4),
        ChessPosition.get(4, 5),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(2, 3))!,
        ChessPosition.get(2, 3),
        ChessPosition.get(3, 2),
        false,
        false
    )
);

makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(3, 1))!,
        ChessPosition.get(3, 1),
        ChessPosition.get(2, 2),
        false,
        false
    )
);

// promote black pawn forward
/*makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(3, 2))!,
        ChessPosition.get(3, 2),
        ChessPosition.get(3, 1),
        false,
        false,
        true,
        "q"
    )
);*/

//promote black pawn capture
makeMove(
    game,
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(3, 2))!,
        ChessPosition.get(3, 2),
        ChessPosition.get(4, 1),
        false,
        false,
        true,
        "q"
    )
);

function makeMove(game: ChessGame, move: ChessBoardSingleMove): void {
    game.makeMove(move);
    console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
    console.log("___________________________");
    console.log("Reverse:");
    //@ts-ignore
    console.log(game.getBoardStateHistory().getCurrentBoardState().boardStats.lastMoveReverseUpdates)
}
