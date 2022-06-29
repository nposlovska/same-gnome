(function () {
    'use strict';

    const COLORS = ['red', 'yellow', 'blue', 'green'];
    const CLASSES = Object.freeze({
        ACTIVE: 'active',
        BALL: 'ball',
        CELL: 'cell',
        ROW: 'row',
        GRID: 'grid',
        CURRENT_SCORE: 'current',
        POSSIBLE_SCORE: 'possible',
        BEST_SCORE: 'best'
    });

    function createProto(className) {
        let proto = document.createElement('div');
        proto.className = className;
        return proto;
    }

    function getIndex(element) {
        return [...element.parentElement.children].indexOf(element);
    }

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    class Balls {
        gridDom = document.getElementById(CLASSES.GRID);
        scoreDom = document.getElementById(CLASSES.CURRENT_SCORE);
        possibleScoreDom = document.getElementById(CLASSES.POSSIBLE_SCORE);
        bestScoreDom = document.getElementById(CLASSES.BEST_SCORE);
        sizeX = 20;
        sizeY = 30;
        score = 0;
        cells = [];

        constructor() {
            this.loadGrid();
            this.bestScoreDom.textContent = localStorage.ballScore || 0;
        }

        loadGrid() {
            this.scoreDom.textContent = this.score;

            for (let y = 0; y < this.sizeY; y++) {
                let row = createProto(CLASSES.ROW);

                this.cells[y] = [];
                for (let x = 0; x < this.sizeX; x++) {
                    const cell = createProto(CLASSES.CELL);
                    cell.appendChild(createProto(CLASSES.BALL));

                    const colorNumber = getRandom(0, COLORS.length);
                    cell.classList.add(COLORS[colorNumber]);
                    row.appendChild(cell);

                    this.cells[y][x] = {
                        isChecked: false, color: colorNumber, dom: cell
                    };
                }

                this.gridDom.appendChild(row);
            }
            this.bindEvents();
        };

        getCoordinates(element) {
            const x = getIndex(element.parentElement);
            const y = getIndex(element.parentElement.parentElement);
            return [x, y];
        }

        bindEvents() {
            this.gridDom.addEventListener('mouseover', e => {
                if (e.target.classList.contains(CLASSES.BALL)) {
                    this.showCluster(...this.getCoordinates(e.target));
                }
            }, false);

            this.gridDom.addEventListener('mouseout', e => {
                if (e.target.classList.contains(CLASSES.BALL)) {
                    this.hideCluster(...this.getCoordinates(e.target));
                }
            }, false);

            this.gridDom.addEventListener('click', e => {
                if (e.target.classList.contains(CLASSES.BALL)) {
                    this.removeCluster(...this.getCoordinates(e.target));
                }
            }, false);
        };

        checkGameEnd() {
            for (let y = 0; y < this.cells.length; y++) {
                for (let x = 0; x < this.cells[y].length; x++) {
                    if (this.getCluster(x, y).length > 1) return;
                }
            }

            this.cells.length ? alert('game over') : alert('you win');
        };

        getCount(cluster) {
            return cluster.length * (cluster.length - 1);
        };

        getNeighbors(x, y) {
            const neighbours = [];

            //left neighbour within borders
            if (x > 0 && this.cells[y] && this.cells[y][x - 1]) {
                neighbours.push([x - 1, y]);
            }

            //right
            if (x < this.sizeY - 1 && this.cells[y] && this.cells[y][x + 1]) {
                neighbours.push([x + 1, y]);
            }

            //top
            if (y > 0 && this.cells[y - 1] && this.cells[y - 1][x]) {
                neighbours.push([x, y - 1]);
            }

            //bottom
            if (y < this.sizeX - 1 && this.cells[y + 1] && this.cells[y + 1][x]) {
                neighbours.push([x, y + 1]);
            }

            return neighbours;
        };

        getCluster(x, y) {
            const cluster = this.getSubCluster(x, y);
            cluster.forEach(([cl_x, cl_y]) => {
                this.cells[cl_y][cl_x].isChecked = false;
            });
            return cluster;
        };

        getSubCluster(x, y, cluster = []) {
            cluster.push([x, y]);
            this.cells[y][x].isChecked = true;

            this.getNeighbors(x, y).forEach(([nb_x, nb_y]) => {
                if (this.cells[nb_y][nb_x].color === this.cells[y][x].color && !this.cells[nb_y][nb_x].isChecked) {
                    this.getSubCluster(nb_x, nb_y, cluster);
                }
            });
            return cluster;
        };

        showCluster(x, y) {
            let cluster = this.getCluster(x, y);
            if (cluster.length < 2) return;
            this.possibleScoreDom.textContent = this.getCount(cluster);

            cluster.forEach(([cl_x, cl_y]) => {
                this.cells[cl_y][cl_x].dom.classList.add(CLASSES.ACTIVE);
            });
        };

        hideCluster(x, y) {
            let cluster = this.getCluster(x, y);
            this.possibleScoreDom.textContent = 0;

            cluster.forEach(([cl_x, cl_y]) => {
                this.cells[cl_y][cl_x].dom.classList.remove(CLASSES.ACTIVE);
            });
        };

        removeCluster(x, y) {
            let cluster = this.getCluster(x, y);
            if (cluster.length < 2) return;

            this.score += this.getCount(cluster);
            this.scoreDom.textContent = this.score;
            this.possibleScoreDom.textContent = 0;

            // compare y coordinate first, then x one
            cluster.sort((a, b) => b[1] === a[1] ? b[0] - a[0] : b[1] - a[1]);

            cluster.forEach(([cl_x, cl_y]) => {
                let rowDom = this.gridDom.children[cl_y];
                rowDom.removeChild(this.cells[cl_y][cl_x].dom);

                this.cells[cl_y].splice(cl_x, 1);
                if (!this.cells[cl_y].length) {
                    this.gridDom.removeChild(rowDom);
                    this.cells.splice(cl_y, 1);
                }
            });

            if (!localStorage.ballScore || localStorage.ballScore < this.score) {
                localStorage.ballScore = this.score;
                this.bestScoreDom.textContent = this.score || 0;
            }
            this.checkGameEnd();
        };
    }

    window.addEventListener('load', () => new Balls(), false);
}());
