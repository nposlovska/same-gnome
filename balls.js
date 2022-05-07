(function () {
    'use strict';
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function Balls(cellProto, rowProto, table, scoreDiv, possibleScoreDiv, best) {
        this.sizeX = 30;
        this.sizeY = 20;
        this.cells = [];
        this.table = table;
        this.scoreDiv = scoreDiv;
        this.possibleScoreDiv = possibleScoreDiv;
        this.classNames = {
            'bomb' : 'bomb',
            'active' : 'active',
            'error' : 'error',
            'cell' : '.' + cellProto.attr('class').split(' ')[0]
        };
        this.loadTable(cellProto, rowProto);
        this.best = best;
        this.best.text(localStorage.ballScore || 0);
    }

    Balls.prototype.score = 0;
    Balls.prototype.colors = ['red', 'yellow', 'blue', 'green'];
    Balls.prototype.loadTable = function (cellProto, rowProto) {
        this.scoreDiv.text(this.score);
        for (var i = 0; i < this.sizeX; i++) {
            var row = rowProto.clone();
            this.cells[i] = [];
            for (var j = 0; j < this.sizeY; j++) {
                var cell = cellProto.clone();
                var colorNumber = getRandom(0, this.colors.length);
                row.append(cell.addClass(this.colors[colorNumber]).show());
                this.cells[i][j] = {
                    is_checked: false,
                    color: colorNumber,
                    dom: cell
                };
            }
            this.table.append(row.show());
        }
        this.bindEvents();
    };
    Balls.prototype.bindEvents =function(cell){
        var self = this;
        this.table.on('mouseover', this.classNames.cell, function(event){
            var x = $(this).index();
            var y = $(this).parent().index();
            self.showClaster(x, y);
        });
        this.table.on('mouseout', this.classNames.cell, function(event){
            var x = $(this).index();
            var y = $(this).parent().index();
            self.hideClaster(x, y);
        });
        this.table.on('click', this.classNames.cell, function(event){
            var x = $(this).index();
            var y = $(this).parent().index();
            self.removeClaster(x, y);
        });
    };
    Balls.prototype.checkGameEnd = function() {
        for (var y=0; y<this.cells.length; y++){
            for (var x=0; x<this.cells[y].length; x++){
                if (this.getClaster(x, y).length > 1){
                    return false;
                }
            }
        }
        if (!this.cells.length) {
            alert('you win');
        } else {
            alert('game over');
        }
    };
    Balls.prototype.getNeighbors = function(x, y) {
        var nb = [];
        if (x>0 && this.cells[y] && this.cells[y][x-1]) {
            nb.push([x-1, y]);
        }
        if (x<this.sizeY-1 && this.cells[y] && this.cells[y][x+1]) {
            nb.push([x+1, y]);
        }
        if (y>0 && this.cells[y-1] && this.cells[y-1][x]) {
            nb.push([x, y-1]);
        }
        if (y<this.sizeX-1 && this.cells[y+1] && this.cells[y+1][x]) {
            nb.push([x, y+1]);
        }
        return nb;
    };
    Balls.prototype.getClaster = function(x, y) {
        var claster = this.getSubClaster(x, y);
        for (var i=0; i<claster.length; i++){
            this.cells[claster[i][1]][claster[i][0]].is_checked = false;
        }
        return claster;
    };
    Balls.prototype.getSubClaster = function(x, y, cl){
        var claster = cl || [];
        claster.push([x, y]);
        this.cells[y][x].is_checked = true;
        var nb = this.getNeighbors(x, y);
        for (var i in nb) {
            if (    this.cells[nb[i][1]][nb[i][0]].color === this.cells[y][x].color
                && !this.cells[nb[i][1]][nb[i][0]].is_checked)
            {
                this.getSubClaster(nb[i][0], nb[i][1], claster);
            }
        }
        return claster;
    };
    Balls.prototype.showClaster = function(x, y) {
        var claster = this.getClaster(x, y);
        this.possibleScoreDiv.text(claster.length*(claster.length-1));
        if(claster.length > 1) {
            for (var i=0; i<claster.length; i++){
                this.cells[claster[i][1]][claster[i][0]].dom.addClass(this.classNames.active);
            }
        }
    };
    Balls.prototype.hideClaster = function(x, y) {
        var claster = this.getClaster(x, y);
        this.possibleScoreDiv.text(0);
        for (var i=0; i<claster.length; i++){
            this.cells[claster[i][1]][claster[i][0]].dom.removeClass(this.classNames.active);
        }
    };
    Balls.prototype.removeClaster = function(x, y) {
        var claster = this.getClaster(x, y);
        if(claster.length < 2)
            return;

        var l = claster.length;
        this.score += l*(l-1);
        this.scoreDiv.text(this.score);
        this.possibleScoreDiv.text(0);

        claster.sort(function(a, b){
            if (b[0] === a[0]) {
                return b[1]-a[1];
            } else {
                return b[0]-a[0];
            }
        });
        for (var i=0; i<claster.length; i++){
            this.cells[claster[i][1]][claster[i][0]].dom.remove();
            this.cells[claster[i][1]].splice(claster[i][0], 1);
            if(!this.cells[claster[i][1]].length) {
                this.table.find('.row').eq(claster[i][1]).remove();
                this.cells.splice(claster[i][1], 1);
            }
        }
        if (!localStorage.ballScore || localStorage.ballScore < this.score) {
            localStorage.ballScore = this.score;
            this.best.text(this.score || 0);
        }
        this.checkGameEnd();
    };
    window.Balls = Balls;
}());
$(document).ready(function(){
    var table = $('#table'),
        cellProto = $('.cell'),
        rowProto = $('.row'),
        countDiv = $('#counter'),
        possibleScoreDiv = $('#possible_count'),
        best = $('#best');

    new Balls(cellProto, rowProto, table, countDiv, possibleScoreDiv, best);
});
