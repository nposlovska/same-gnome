(function () {
    'use strict';

    const COLORS = ['red', 'yellow', 'blue', 'green'];
    const CLASSES = Object.freeze({
        ACTIVE: 'active',
        BALL: 'ball',
        CELL: 'cell',
        ROW: 'row',
        TABLE: 'table',
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
        tableDom = document.getElementById(CLASSES.TABLE);
        scoreDom = document.getElementById(CLASSES.CURRENT_SCORE);
        possibleScoreDom = document.getElementById(CLASSES.POSSIBLE_SCORE);
        bestScoreDom = document.getElementById(CLASSES.BEST_SCORE);
        sizeX = 10;
        sizeY = 15;
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
                    let cell = createProto(CLASSES.CELL);
                    cell.appendChild(createProto(CLASSES.BALL));

                    let colorNumber = getRandom(0, COLORS.length);
                    cell.classList.add(COLORS[colorNumber]);
                    row.appendChild(cell);

                    this.cells[y][x] = {
                        isChecked: false, color: colorNumber, dom: cell
                    };
                }

                this.tableDom.appendChild(row);
            }
            this.bindEvents();
        };

        getCoordinates(element) {
            let x = getIndex(element.parentElement);
            let y = getIndex(element.parentElement.parentElement);
            return [x, y];
        }

        bindEvents() {
            this.tableDom.addEventListener('mouseover', e => {
                if (e.target.classList.contains(CLASSES.BALL)) {
                    this.showCluster(...this.getCoordinates(e.target));
                }
            }, false);

            this.tableDom.addEventListener('mouseout', e => {
                if (e.target.classList.contains(CLASSES.BALL)) {
                    this.hideCluster(...this.getCoordinates(e.target));
                }
            }, false);

            this.tableDom.addEventListener('click', e => {
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
            let neighbours = [];

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

        operateNeighbor(coords, nbCoords, neighbours) {
            if (this.cells[nbCoords.y] && this.cells[nbCoords.y][nbCoords.x]
                && !this.cells[nbCoords.y][nbCoords.x].isChecked
                && this.cells[nbCoords.y][nbCoords.x].color === this.cells[coords.y][coords.x].color) {
                neighbours.push(nbCoords);
            }
            return neighbours;
        }

        getCluster(x, y) {
            let cluster = this.getSubCluster(x, y);
            cluster.forEach(coords => {
                this.cells[coords[1]][coords[0]].is_checked = false;
            });
            return cluster;
        };

        getSubCluster(x, y, cl) {
            let cluster = cl || [];
            cluster.push([x, y]);
            this.cells[y][x].is_checked = true;

            let nb = this.getNeighbors(x, y);
            nb.forEach(coords => {
                let nb_y = coords[1];
                let nb_x = coords[0];

                if (this.cells[nb_y][nb_x].color === this.cells[y][x].color && !this.cells[nb_y][nb_x].is_checked) {
                    this.getSubCluster(nb_x, nb_y, cluster);
                }
            });
            return cluster;
        };

        showCluster(x, y) {
            let cluster = this.getCluster(x, y);
            if (cluster.length < 2) return;
            this.possibleScoreDom.textContent = this.getCount(cluster);

            cluster.forEach(coords => {
                this.cells[coords[1]][coords[0]].dom.classList.add(CLASSES.ACTIVE);
            });
        };

        hideCluster(x, y) {
            let cluster = this.getCluster(x, y);
            this.possibleScoreDom.textContent = 0;

            cluster.forEach(coords => {
                this.cells[coords[1]][coords[0]].dom.classList.remove(CLASSES.ACTIVE);
            });
        };

        removeCluster(x, y) {
            let cluster = this.getCluster(x, y);
            if (cluster.length < 2) return;

            this.score += this.getCount(cluster);
            this.scoreDom.textContent = this.score;
            this.possibleScoreDom.textContent = 0;

            cluster.sort((a, b) => b[0] === a[0] ? b[1] - a[1] : b[0] - a[0]);

            cluster.forEach(coords => {
                let rowDom = this.tableDom.children[coords[1]];
                rowDom.removeChild(this.cells[coords[1]][coords[0]].dom);

                this.cells[coords[1]].splice(coords[0], 1);
                if (!this.cells[coords[1]].length) {
                    this.tableDom.removeChild(rowDom);
                    this.cells.splice(coords[1], 1);
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
