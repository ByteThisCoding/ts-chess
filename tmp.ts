/***
 * Temporary file for testing
 */

import { ChessBoardSingleMove } from "./src/moves/chess-board-move";
import { ChessGame } from "./src/chess-game";
import { ChessPosition } from "./src/chess-position";
import { ChessPlayer } from "./src/enums";

const game = new ChessGame();
game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(5, 2))!,
        "e4",
        ChessPosition.get(5, 2),
        ChessPosition.get(5, 4),
        null,
        1,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(5, 7))!,
        "e5",
        ChessPosition.get(5, 7),
        ChessPosition.get(5, 5),
        null,
        1,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 1))!,
        "Nf3",
        ChessPosition.get(7, 1),
        ChessPosition.get(6, 3),
        null,
        2,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(4, 7))!,
        "d6",
        ChessPosition.get(4, 7),
        ChessPosition.get(4, 6),
        null,
        2,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(6, 1))!,
        "Bc4",
        ChessPosition.get(6, 1),
        ChessPosition.get(3, 4),
        null,
        3,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(2, 8))!,
        "Nc6",
        ChessPosition.get(2, 8),
        ChessPosition.get(3, 6),
        null,
        3,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(6, 3))!,
        "Nxe5",
        ChessPosition.get(6, 3),
        ChessPosition.get(5, 5),
        null,
        4,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(4, 6))!,
        "Dxe5",
        ChessPosition.get(4, 6),
        ChessPosition.get(5, 5),
        null,
        4,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

// castle
game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(5, 1))!,
        "O-O",
        ChessPosition.get(5, 1),
        ChessPosition.get(8, 1),
        null,
        5,
        true,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(1, 8))!,
        "Rb8",
        ChessPosition.get(1, 8),
        ChessPosition.get(2, 8),
        null,
        5,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 2))!,
        "g4",
        ChessPosition.get(7, 2),
        ChessPosition.get(7, 4),
        null,
        6,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(1, 7))!,
        "a5",
        ChessPosition.get(1, 7),
        ChessPosition.get(1, 5),
        null,
        6,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 4))!,
        "g5",
        ChessPosition.get(7, 4),
        ChessPosition.get(7, 5),
        null,
        6,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.black,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(6, 7))!,
        "f5",
        ChessPosition.get(6, 7),
        ChessPosition.get(6, 5),
        null,
        6,
        false,
        false
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");

// en passant
game.makeMove(
    new ChessBoardSingleMove(
        ChessPlayer.white,
        game
            .getBoardStateHistory()
            .getCurrentBoardState()
            .getPieceAtPosition(ChessPosition.get(7, 5))!,
        "gxf5",
        ChessPosition.get(7, 5),
        ChessPosition.get(6, 6),
        null,
        6,
        false,
        true
    )
);
console.log(game.getBoardStateHistory().getCurrentBoardState().toString());
console.log("___________________________");