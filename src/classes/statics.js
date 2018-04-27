const validDirections = [
    'upLeft',
    'up',
    'upRight',
    'right',
    'downRight',
    'down',
    'downLeft',
    'left'
];

const frequencies = {
    scrabble: {
        A: 13,
        B: 3,
        C: 3,
        D: 6,
        E: 18,
        F: 3,
        G: 4,
        H: 3,
        I: 12,
        J: 2,
        K: 2,
        L: 5,
        M: 3,
        N: 8,
        O: 11,
        P: 3,
        Qu: 2,
        R: 9,
        S: 6,
        T: 9,
        U: 6,
        V: 3,
        W: 3,
        X: 2,
        Y: 3,
        Z: 2
    },
    boggle: {
        A: 12,
        B: 1,
        C: 5,
        D: 6,
        E: 19,
        F: 4,
        G: 3,
        H: 5,
        I: 11,
        J: 1,
        K: 1,
        L: 5,
        M: 4,
        N: 11,
        O: 11,
        P: 4,
        Qu: 1,
        R: 12,
        S: 9,
        T: 13,
        U: 4,
        V: 1,
        W: 2,
        X: 1,
        Y: 3,
        Z: 1
    },
    fiveByFive: [
        "aaafrs",
        "aaeeee",
        "aafirs",
        "adennn",
        "aeeeem",
        "aeegmu",
        "aegmnn",
        "afirsy",
        "bjkqxz",
        "ccenst",
        "ceiilt",
        "ceilpt",
        "ceipst",
        "ddhnot",
        "dhhlor",
        "dhlnor",
        "dhlnor",
        "eiiitt",
        "emottt",
        "ensssu",
        "fiprsy",
        "gorrvw",
        "iprrry",
        "nootuw",
        "ooottu",
    ],
    otherFiveByFive: [
        "AAAFRS",
        "AAEEEE",
        "AAFIRS",
        "ADENNN",
        "AEEEEM",
        "AEEGMU",
        "AEGMNN",
        "AFIRSY",
        "BJKQXZ",
        "CCNSTW",
        "CEIILT",
        "CEILPT",
        "CEIPST",
        "DHHNOT",
        "DHHLOR",
        "DHLNOR",
        "DDLNOR",
        "EIIITT",
        "EMOTTT",
        "ENSSSU",
        "FIPRSY",
        "GORRVW",
        "HIPRRY",
        "NOOTUW",
        "OOOTTU"
    ]
};

function getRandomLetter(previousLetters = [], dimension = 0) {
    const lettersObj = Object.assign({}, frequencies.boggle); // { ...frequencies.boggle };
    previousLetters.forEach(letter => {
        lettersObj[letter]--;
    });
    const lettersArr = [];
    for (let prop in lettersObj) {
        for (let i = 0; i < lettersObj[prop]; i++) {
            lettersArr.push(prop);
        }
    }
    return lettersArr[~~(Math.random() * lettersArr.length)];
}

function createBoard() {
    let x, y;
    if (typeof arguments[0] === 'object') {
        x = arguments[0].x;
        y = arguments[0].y;
    } else {
        x = arguments[0];
        y = arguments[1] || x;
    }
    if (!x && !y) {
        x = y = 4;
    }
    if (x <= 0 || y <= 0) throw new Error('dimensions must be positive');
    const board = [];
    const previousLetters = [];
    for (let i = 0; i < y; i++) {
        const row = [];
        for (let j = 0; j < x; j++) {
            const letter = getRandomLetter(previousLetters);
            previousLetters.push(letter);
            row.push(letter);
        }
        board.push(row);
    }
    return board;
}

function walkPath(word, currentLetter, validPaths, currentPath = []) {

    currentPath.push(currentLetter);

    let adjacentLetters = currentLetter.adjacentLetters;
    let nextLetter = word[currentPath.length];

    if (!nextLetter) {
        validPaths.push(currentPath);
        return validPaths;
    }

    const nextPaths = [];

    findNextLetters: for (let prop in currentLetter) {
        if (validDirections.includes(prop) && currentLetter[prop]) {
            if (currentLetter[prop].value.toUpperCase() === nextLetter && !currentPath.includes(currentLetter[prop])) {
                nextPaths.push(currentLetter[prop]);
            }
        }
    }

    nextPaths.forEach(currentLetter => {
        walkPath(word, currentLetter, validPaths, [...currentPath]);
    });

    return validPaths;
}

function createUser(config) {
    const user = Object.assign({}, config);
    if (!user.words) user.words = [];
    if (!user.points) user.points = 0;
    if (!user.winner) user.winner = false;
    return user
}

function countPoints(word, boardSize = 4) {
    if (!word || !word.length || parseInt(word.length) !== word.length) return 0;
    switch (boardSize) {
        case 3:
        case 4:
            switch (word.length) {
                case 0:
                case 1:
                case 2:
                    return 0;
                case 3:
                case 4:
                    return 1;
                case 5:
                    return 2;
                case 6:
                    return 3;
                case 7:
                    return 5
                default:
                    if (word.length > 7) return 11;
                    else return 0;
            }
        default:
            switch (word.length) {
                case 0:
                case 1:
                case 2:
                case 3:
                    return 0;
                case 4:
                    return 1;
                case 5:
                    return 2;
                case 6:
                    return 5;
                case 7:
                default:
                    if (word.length > 7) return 11;
                    else return 0;
            }
    }
}

function compareWords(players, boardSize = 4) {
    let allWords = players.reduce((words, player) => {
        words.push(...player.words);
        return words;
    }, []);
    return players.map(player => {
        let words = player.words.filter(playerWord => {
            // ONLY RETURN WORDS THAT ARE PRESENT ONLY ONCE
            let count = allWords.filter(word => word.toUpperCase() === playerWord.toUpperCase()).length;
            return count === 1;
        });
        let points = words.reduce((points, word) => points + Game.countPoints(word, boardSize), 0);
        // RETURN THE PLAYER WITH THE UPDATED WORD ARRAY AND POINTS
        return Object.assign({}, player, { points });
    });
}

function findWinner(game) {
    let players = Game.compareWords(game.players, game.board.length)
    let winner = players.reduce((winner, player) => winner.points > player.points ? winner : player);
    players = players.map(player => {
        if (player === winner) return Object.assign({}, player, { winner: true });
        else return Object.assign({}, player, { winner: false });
    });
    return Object.assign({}, game, { players });
}

module.exports = {
    validDirections,
    frequencies,
    getRandomLetter,
    createBoard,
    walkPath,
    createUser,
    countPoints,
    compareWords,
    findWinner
}
