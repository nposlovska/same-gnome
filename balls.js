(function () {
    'use strict';

    const COLORS = ['red', 'yellow', 'blue', 'green'];
    const ACTIVE_CLASS = 'active';
    const BALL_CLASS = 'circle';
    const CELL_CLASS = 'cell';
    const ROW_CLASS = 'row';

    function createProto(className) {
        let proto = document.createElement('div');
        proto.className = className;
        return proto;
    }

    function getIndex(element) {
        return [...element.parentElement.children].indexOf(element);
    }

    class Balls {
        tableDom = document.getElementById('table');
        scoreDom = document.getElementById('counter');
        possibleScoreDom = document.getElementById('possible_count');
        bestScoreDom = document.getElementById('best');
        sizeX = 30;
        sizeY = 20;
        cells = [];
        score = 0;

        constructor() {
            this.loadGrid();
            this.bestScoreDom.textContent = localStorage.ballScore || 0;
        }

        loadGrid() {
            this.scoreDom.textContent = this.score;

            for (let i = 0; i < this.sizeX; i++) {
                let row = createProto(ROW_CLASS);

                this.cells[i] = [];
                for (let j = 0; j < this.sizeY; j++) {
                    let cell = createProto(CELL_CLASS);
                    cell.appendChild(createProto(BALL_CLASS));

                    let colorNumber = getRandom(0, COLORS.length);
                    cell.classList.add(COLORS[colorNumber]);
                    row.appendChild(cell);

                    this.cells[i][j] = {
                        is_checked: false, color: colorNumber, dom: cell
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
            addEvent(this.tableDom, 'mouseover', e => {
                if (e.target.classList.contains(BALL_CLASS)) {
                    this.showCluster(...this.getCoordinates(e.target));
                }
            });
            addEvent(this.tableDom, 'mouseout', e => {
                if (e.target.classList.contains(BALL_CLASS)) {
                    this.hideCluster(...this.getCoordinates(e.target));
                }
            });
            addEvent(this.tableDom, 'click', e => {
                if (e.target.classList.contains(BALL_CLASS)) {
                    this.removeCluster(...this.getCoordinates(e.target));
                }
            });
        };

        checkGameEnd() {
            let isSmthLeft;
            this.cells.forEach((row, y) => {
               isSmthLeft = row.some((cell, x) => this.getCluster(x, y).length > 1);
            });

            if (isSmthLeft) return;
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
                this.cells[coords[1]][coords[0]].dom.classList.add(ACTIVE_CLASS);
            });
        };

        hideCluster(x, y) {
            let cluster = this.getCluster(x, y);
            this.possibleScoreDom.textContent = 0;

            cluster.forEach(rows => {
                this.cells[rows[1]][rows[0]].dom.classList.remove(ACTIVE_CLASS);
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

    window.Balls = Balls;

    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    const addEvent = (obj, eventName, handler) => {
        const handlerWrapper = event => {
            event = event || window.event;
            if (!event.target && event.srcElement) {
                event.target = event.srcElement;
            }
            return handler.call(obj, event);
        };
        if (obj.addEventListener) {
            obj.addEventListener(eventName, handlerWrapper, false);
        } else if (obj.attachEvent) {
            obj.attachEvent('on' + eventName, handlerWrapper);
        }
        return handlerWrapper;
    }

    function removeEvent(obj, eventName, handler) {
        if (obj.removeEventListener) {
            obj.removeEventListener(eventName, handler);
        } else if (obj.detachEvent) {
            obj.detachEvent("on" + eventName, handler);
        }
    }

    addEvent(window, 'load', () => new Balls());
}());
