const Path = require('./Path');
const Letter = require('./Letter');
const statics = require('./statics');
const Game = require('./game');

// const board = [
//     ['K', 'X', 'O', 'Z', 'V', 'F'],
//     ['B', 'A', 'M', 'L', 'H', 'R'],
//     ['V', 'U', 'Q', 'J', 'M', 'S'],
//     ['V', 'A', 'J', 'A', 'M', 'K'],
//     ['V', 'I', 'T', 'T', 'D', 'O'],
//     ['U', 'P', 'K', 'B', 'A', 'B'],
// ];

/*
FRONT END
 - FIND / JOIN
    -- Game - owner
    -- Game - players
    -- Game - dimensions
    -- Game - status ('open', 'closed', 'over')
 - COMPETE
    -- Boggle - board
    -- Boggle - Path - start path, continue path, etc...
    -- Boggle - Letter
    -- Boggle - validate words
    -- Game - start time
    -- Game - end time
    -- Game - players
 - FREEPLAY
    -- Boggle - board
    -- Boggle - Path - start path, continue path, etc...
    -- Boggle - Letter
    -- Boggle - validate words
    -- Boggle - create board
 - RESULTS
    -- Game - owner
    -- Game - players
    -- Game - board
    -- Game - winner
    -- Game - all points
BACK END
 - SOCKETS
    -- Game - status
    -- Game - board
    -- Game - owner
    -- Game - players
    -- Boggle - validate
    -- Cache - vaidate -- should this be on the boggle class ?
*/

module.exports = class Boggle {
    static get Game() { return Game }
    static get Path() { return Path }
    static get Letter() { return Letter }
    static get validDirections() { return statics.validDirections }
    static get frequencies() { return statics.frequencies }
    static get getRandomLetter() { return statics.getRandomLetter }
    static get createBoard() { return statics.createBoard }
    static get walkPath() { return statics.walkPath }
    static validateWordsFromBoard(board, ...words) {
        if (words.length === 1 && Array.isArray(words[0])) words = words[0];
        let boggle = new Boggle(board);
        let response = [];
        return words.map(word => {
            let value = word.toUpperCase();
            let validations = boggle.validate(word);
            return { value, validations };
        });
    }
    static get default() {
        return {
            board: [[Letter.default]],
            dimensions: {
                x: 1,
                y: 1
            },
            owner: ""
        }
    }
    constructor() {
        let board, x, y;
        if (Array.isArray(arguments[0])) {
            board = arguments[0];
            if (!board.every(row => Array.isArray(row))) throw new Error('board must be a two dimensional array');
            if (!board.every((row, i) => row.length === (board[i + 1] || board[0]).length)) throw new Error('all rows must be of equal length');
            y = board.length;
            x = board[0].length;
        } else if (typeof arguments[0] === 'object') {
            board = [];
            x = arguments[0].x;
            y = arguments[0].y;
        } else {
            board = [];
            x = arguments[0];
            y = arguments[1] || x;
        }
        if (!x && !y) {
            x = y = 4;
        }
        if (x <= 0 || y <= 0) throw new Error('dimensions must be positive');

        // IF WE ARE GIVEN A BOARD
        let previousLetters = [];
        if (board.length) {
            board = board.map(row => row.map(letter => {
                const newLetter = new Boggle.Letter(letter, previousLetters);
                previousLetters.push(newLetter);
                return newLetter;
            }));
        } else {
            // IF WE ARE NOT GIVEN A BOARD
            // CREATE A BOARD
            for (let i = 0; i < y; i++) {
                const row = [];
                for (let j = 0; j < x; j++) {
                    const newLetter = new Boggle.Letter(null, previousLetters);
                    previousLetters.push(newLetter);
                    row.push(newLetter);
                }
                board.push(row);
            }
        }

        for (let i = 0; i < board.length; i++) {
            let prevRow = board[i - 1] || [];
            let row = board[i];
            let nextRow = board[i + 1] || [];
            for (let j = 0; j < row.length; j++) {
                let letter = row[j];
                let left = row[j - 1];
                let right = row[j + 1];
                let up = prevRow[j];
                let down = nextRow[j];
                let upLeft = prevRow[j - 1];
                let upRight = prevRow[j + 1];
                let downLeft = nextRow[j - 1];
                let downRight = nextRow[j + 1];
                Object.assign(letter, {
                    coordinates: {
                        y: i,
                        x: j
                    },
                    left,
                    right,
                    up,
                    down,
                    upLeft,
                    upRight,
                    downLeft,
                    downRight,
                });
            }
        }

        this.board = board;
    }
    get dimensions() {
        return {
            y: this.board.length,
            x: this.board[0].length
        }
    }
    get boardValues() {
        return this.board.map(row => row.map(letter => letter.value));
    }
    validate(word) {
        if (!word) return [];
        word = word.toUpperCase().split('').reduce((arr, val) => {
            if (arr[arr.length - 1] === "Q" && val === "U") arr[arr.length - 1] += val;
            else arr.push(val);
            return arr;
        }, []);

        // console.log(word);

        const startingPoints = [];

        const validPaths = [];

        findStartingRows:
        for (let y = 0; y < this.board.length; y++) {
            const row = this.board[y];

            findStartingIndices:
            for (let x = 0; x < row.length; x++) {
                if (row[x].value.toUpperCase() === word[0]) {
                    startingPoints.push(row[x]);
                }
            }
        }

        startingPoints.forEach(startingLetter => {
            Boggle.walkPath(word, startingLetter, validPaths);
        });

        return validPaths;
    }
    startPath() {
        let { board } = this;
        let start;
        if (arguments[0] instanceof Letter) {
            start = arguments[0];
        } else {
            let x, y;
            if (typeof arguments[0] === 'object') {
                y = arguments[0].y;
                x = arguments[0].x;
            } else if (arguments.length === 2) {
                x = arguments[0];
                y = arguments[1];
            }
            if (x >= this.dimensions.x || x < 0) throw new Error('invalid coordinate x: ' + x);
            if (y >= this.dimensions.y || y < 0) throw new Error('invalid coordinate y: ' + y);
            if ((!x && x !== 0) || (!y && y !== 0)) throw new Error('must specify coordinates x & y');
            start = { x, y };
        };
        return new Boggle.Path({ board, start });
    }
    createPath(path) {
        return this.startPath(path[0]).move(...path.slice(1));
    }
    equals(board) {
        if (board.length !== this.board.length) return false;
        if (!board.every(row => row.length === this.board.length)) return false;
        try {
            return this.boardValues.every((row, i) => row.every((letter, j) => letter.toUpperCase() === board[i][j].value.toUpperCase()));
        }
        catch (e) {
            return false;
        }
    }
}
