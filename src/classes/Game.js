const statics = require('./statics');
const Boggle = require('./Boggle');

class Game {
    static get createUser() { return statics.createUser }
    static get countPoints() { return statics.countPoints }
    static get compareWords() { return statics.compareWords }
    static get findWinner() { return statics.findWinner }
    constructor(game) {
        Object.assign(this, game);
        if (!this.owner) throw new Error('game must have an owner');
        if (!this.date) this.date = new Date(Date.now());
        if (!this.startTime) this.startTime = null;
        if (!this.duration) this.duration = 3;
        if (!this.endTime) this.endTime = null;
        if (!this.winner) this.winner = null;
        if (!this.maxPlayers) this.maxPlayers = 10;
        this.players = (this.players || [this.owner]).map(player => Game.createUser(player));
    }
}

module.exports = Game;
