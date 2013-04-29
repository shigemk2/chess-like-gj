$(document).ready(function() {
    var div1 = $("#div1").get(0);
    var svg1 = $("#svg1").get(0);
    var divd = $("#divd").get(0);
    var side = $("#side").get(0);

    var objs = [ ];
    var loaded = 0;

    for (var i = 0; i < 12; i++) {
        objs[i] = document.createElement("object");
        objs[i].data = "Chess_" + "kqrbnp"[i % 6] + (i < 6 ? "d" : "l") + "t45.svg";
        objs[i].type = "image/svg+xml";
        objs[i].width = objs[i].height = 45;
        objs[i].onload = function() {
            loaded++;
            if (loaded === objs.length) {
                for (var i = 0; i < 12; i++) {
                    pics[i] = objs[i].contentDocument.rootElement.cloneNode(true);
                }
                initBoard();
                init();
            }
        };
        div1.appendChild(objs[i]);
    }

    var pics  = [ ];
    var cells = [ ];
    var move  = [ ];
    var bak   = [ ];
    var kings = [ ];
    var sx = -1, sy = -1;
    var ex = -1, ey = -1;
    var player;
    var isChecked;
    var pgrp;
    var moving  = 1;
    var history = [ ];

    function initBoard() {
        for (var y = 0; y < 8; y++) {
            cells[y] = [ ];
            move [y] = [ ];
            for (var x = 0; x < 8; x++) {
                var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                $(g).attr("transform", "translate(" + (x * 45) + "," + (y * 45) + ")");
                g.cx = x;
                g.cy = y;
                g.piece = null;
                g.ptype = 0;
                var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                $(r).attr("width" , 45);
                $(r).attr("height" , 45);
                r.cell = g;
                r.onmousedown = function() { click(this.cell); };
                g.appendChild(r);
                g.panel = r;
                svg1.appendChild(g);
                cells[y][x] = g;
                move [y][x] = 0;
            }
        }
    }

    function init() {
        for (y = 0; y < 8; y++) {
            for (x = 0; x < 8; x++) {
                removePiece(cells[y][x]);
            }
        }
        for (x = 0; x < 8; x++) {
            var type = [3, 5, 4, 2, 1, 4, 5, 3][x];
            putPiece(x, 0, type);
            putPiece(x, 1, 6);
            putPiece(x, 6, 12);
            putPiece(x, 7, type + 6);
        }
        kings[1] = cells[0][4].piece;
        kings[2] = cells[7][4].piece;
        player = 1;
        change();
        setPanel();
    }

    function setPanel() {
        var myking = kings[player].cell;
        var kx = myking.cx, ky = myking.cy;
        for (var y = 0; y < 8; y++) {
            for (var x = 0; x < 8; x++) {
                var c;
                if (x == sx && y == sy) {
                    c = "red";
                } else if (move[y][x] !== 0) {
                    c = "yellow";
                } else if (isChecked && x == kx && y == ky) {
                    c = "green";
                } else if ( (x + y) % 2 === 0) {
                    c = "#d3d3d3";
                } else {
                    c = "#87ceeb";
                }
                $(cells[y][x].panel).attr("fill", c);
            }
        }
    }

    function click(cell) {
        var x = cell.cx, y = cell.cy;
        var m = move[y][x];

        if (m !== 0) {
            history[moving] = replaceNumToAlpha(x) + " " + (y + 1);
            $(side).append("<p>第" + moving + "手 " + history[moving] + "</p>");
            moving++;

            if (m === 3) {
                removePiece(cells[ey][ex]);
            }
            ex = ey = -1;
            if (m === 2) {
                ex = x;
                ey = y;
            }
            movePiece(cell);
            if (m === 4) {
                sx = 0;
                sy = y;
                movePiece(cells[y][2]);
            } else if (m === 5) {
                sx = 7;
                sy = y;
                movePiece(cells[y][5]);
            }
            if (m === 6) {
                pgrp = document.createElementNS("http://www.w3.org/2000/svg", "g");
                var r1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                $(r1).attr("width" , 360);
                $(r1).attr("height", 360);
                $(r1).attr("fill", "black");
                $(r1).attr("fill-opacity", 0.5);
                pgrp.appendChild(r1);
                for (var i = 0; i <= 3; i++) {
                    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    $(g).attr("transform", "translate(" + (90 + i * 45) + ",157.5)");
                    var r2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    $(r2).attr("width" , 45);
                    $(r2).attr("height", 45);
                    $(r2).attr("fill", "yellow");
                    g.appendChild(r2);
                    var pt = i + 2 + (player - 1) * 6;
                    var p = pics[pt - 1].cloneNode(true);
                    g.appendChild(p);
                    p.ptype = r2.ptype = pt;
                    p.onmousedown = r2.onmousedown = promotion;
                    pgrp.appendChild(g);
                }
                svg1.appendChild(pgrp);
                sx = x;
                sy = y;
            } else {
                change();
            }
        } else if (getPlayer(x, y) == player && !(x == sx && y == sy)) {
            setMove(cell);
        } else {
            eraseMove();
            sx = sy = -1;
        }
        setPanel();
    }

    function promotion() {
        var pt = this.ptype;
        svg1.removeChild(pgrp);
        removePiece(cells[sy][sx]);
        putPiece(sx, sy, pt);
        cells[sy][sx].piece.moved = true;
        sx = sy = -1;
        change();
        setPanel();
    }

    function setMove(cell) {
        var x = cell.cx, y = cell.cy;
        var p = cell.piece, pt = cell.ptype;
        var rival = 3 - player;
        eraseMove();
        sx = x;
        sy = y;
        var t = pt, dy = 1;
        if (t >= 7) {
            t -= 6;
            dy = -1;
        }
        if (t == 1) {
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    setMove1(x + j, y + i);
                }
            }
            if (!p.moved) {
                var r1 = cells[y][0].piece;
                if (r1 !== null && !r1.moved && cells[y][1].ptype + cells[y][2].ptype + cells[y][3].ptype === 0) {
                    cells[y][2].ptype = cells[y][0].ptype;
                    cells[y][0].ptype = 0;
                    checkAndSet(1, y, 4);
                    cells[y][0].ptype = cells[y][2].ptype;
                    cells[y][2].ptype = 0;
                }
                var r2 = cells[y][7].piece;
                if (r2 !== null && !r2.moved && cells[y][5].ptype + cells[y][6].ptype === 0) {
                    cells[y][5].ptype = cells[y][7].ptype;
                    cells[y][7].ptype = 0;
                    checkAndSet(6, y, 5);
                    cells[y][7].ptype = cells[y][5].ptype;
                    cells[y][5].ptype = 0;
                }
            }
        }
        if (t == 2 || t == 3) {
            setMove2(x, y,  1,  0);
            setMove2(x, y, -1,  0);
            setMove2(x, y,  0,  1);
            setMove2(x, y,  0, -1);
        }
        if (t == 2 || t == 4) {
            setMove2(x, y,  1,  1);
            setMove2(x, y,  1, -1);
            setMove2(x, y, -1,  1);
            setMove2(x, y, -1, -1);
        }
        if (t == 5) {
            for (i = -2; i <= 2; i++) {
                for (j = -2; j <= 2; j++) {
                    if (i * i + j * j == 5) {
                        setMove1(x + j, y + i);
                    }
                }
            }
        }
        if (t == 6) {
            var f = 1;
            if (cells[y + dy * 2] == undefined) f = 6;
            if (check(x, y + dy, 0)) {
                checkAndSet(x, y + dy, f);
                if (!p.moved && check(x, y + dy * 2, 0)) {
                    checkAndSet(x, y + dy * 2, 2);
                }
            }
            if (getPlayer(x - 1, y + dy) == rival) {
                checkAndSet(x - 1, y + dy, f);
            }
            if (getPlayer(x + 1, y + dy) == rival) {
                checkAndSet(x + 1, y + dy, f);
            }
            if ( (ex == x - 1 || ex == x + 1) && ey == y) {
                var ept = cells[ey][ex].ptype;
                cells[ey][ex].ptype = 0;
                checkAndSet(ex, y + dy, 3);
                cells[ey][ex].ptype = ept;
            }
        }
    }

    function setMove1(x, y) {
        var ret = check(x, y, 0);
        if (ret || getPlayer(x, y) == 3 - player) {
            checkAndSet(x, y, 1);
        }
        return ret;
    }

    function setMove2(x, y, dx, dy) {
        do {
            x += dx;
            y += dy;
        } while (setMove1(x, y));
    }

    var canMove;

    function checkAndSet(x, y, f) {
        var p  = cells[sy][sx].piece;
        var p1 = cells[sy][sx].ptype;
        var p2 = cells[ y][ x].ptype;
        p.cell = cells[ y][ x];
        cells[sy][sx].ptype = 0;
        cells[ y][ x].ptype = p1;
        if (!getChecked()) {
            move[y][x] = f;
            canMove = true;
        }
        cells[sy][sx].ptype = p1;
        cells[ y][ x].ptype = p2;
        p.cell = cells[sy][sx];
    }

    function getStalemated() {
        canMove = false;
        for (var y = 0; y <= 7; y++) {
            for (var x = 0; x <= 7; x++) {
                if (getPlayer(x, y) == player) {
                    setMove(cells[y][x]);
                    if (canMove) return false;
                }
            }
        }
        return true;
    }

    var message = "";

    function change() {
        player = 3 - player;
        if (player == 1) {
            $(div1).text("Chess (Black)");
            $(div1).attr("style" , "background-color: #000; color: #fff;");
        } else if (player == 2) {
            $(div1).text("Chess (White)");
            $(div1).attr("style" , "background-color: #fff; color: #000;");
        }
        isChecked = getChecked();
        if (getStalemated()) {
            if (isChecked) {
                if (player === 1) {
                    message = "White wins!";
                } else {
                    message = "Black wins!";
                }
            } else {
                message = "Draw!";
            }
            if (message !== "") {
                pgrp = document.createElementNS("http://www.w3.org/2000/svg", "g");
                var r1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                $(r1).attr("x"     ,  20);
                $(r1).attr("y"     , 170);
                $(r1).attr("width" , 320);
                $(r1).attr("height",  20);
                $(r1).attr("stroke", "red");
                $(r1).attr("fill"  , "white");
                pgrp.appendChild(r1);
                var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
                $(t).attr("x", 180);
                $(t).attr("y", 186);
                $(t).attr("text-anchor", "middle");
                t.textContent = message;
                pgrp.appendChild(t);
                var r2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                $(r2).attr("width" , 360);
                $(r2).attr("height", 360);
                $(r2).attr("fill-opacity", 0);
                r2.onmousedown = function() {
                    svg1.removeChild(pgrp);
                    init();
                };
                pgrp.appendChild(r2);
                svg1.appendChild(pgrp);
            }
        }
        sx = sy = -1;
        eraseMove();
    }

    function getChecked() {
        var myking = kings[player].cell;
        var kx = myking.cx, ky = myking.cy;
        var king = 7, queen = 8, rook = 9, bishop = 10, knight = 11, pawn = 12, dy = 1;
        if (player === 2) {
            king = 1;
            queen = 2;
            rook = 3;
            bishop = 4;
            knight = 5;
            pawn = 6;
            dy = -1;
        }
        if (check(kx - 1, ky + dy, pawn) || check(kx + 1, ky + dy, pawn)) return true;
        for (y = -1; y <= 1; y++) {
            for (x = -1; x <= 1; x++) {
                if (check(kx + x, ky + y, king)) {
                    return true;
                }
            }
        }
        for (y = -2; y <= 2; y++) {
            for (x = -2; x <= 2; x++) {
                if (x * x + y * y == 5 && check(kx + x, ky + y, knight)) {
                    return true;
                }
            }
        }
        if (checkPiece(kx, ky,  1,  0, rook, queen)) return true;
        if (checkPiece(kx, ky, -1,  0, rook, queen)) return true;
        if (checkPiece(kx, ky,  0,  1, rook, queen)) return true;
        if (checkPiece(kx, ky,  0, -1, rook, queen)) return true;
        if (checkPiece(kx, ky,  1,  1, bishop, queen)) return true;
        if (checkPiece(kx, ky, -1,  1, bishop, queen)) return true;
        if (checkPiece(kx, ky,  1, -1, bishop, queen)) return true;
        if (checkPiece(kx, ky, -1, -1, bishop, queen)) return true;

        return false;
    }

    function checkPiece(x, y, dx, dy, t1, t2) {
        do {
            x += dx;
            y += dy;
        } while (check(x, y, 0));
        return check(x, y, t1) || check(x, y, t2);
    }

    function eraseMove() {
        for (var y = 0; y < 8; y++) {
            for (var x = 0; x < 8; x++) {
                move[y][x] = 0;
            }
        }
    }

    function getPlayer(x, y) {
        if (cells[y] == undefined) return 0;
        if (cells[y][x] == undefined) return 0;
        var t = cells[y][x].ptype;
        if (t === 0) return 0;
        if (t <= 6) return 1;
        return 2;
    }

    function check(x, y, n) {
        if (cells[y] == undefined) return false;
        if (cells[y][x] == undefined) return false;
        return cells[y][x].ptype == n;
    }

    function movePiece(cell) {
        var p = removePiece(cells[sy][sx]);
        eraseMove();
        sx = sy = -1;
        putOnCell(cell, p);

        p.moved = true;
    }

    function replaceNumToAlpha(num) {
        switch(num) {
        case 0:
            return 'a';
        case 1:
            return 'b';
        case 2:
            return 'c';
        case 3:
            return 'd';
        case 4:
            return 'e';
        case 5:
            return 'f';
        case 6:
            return 'g';
        case 7:
            return 'h';
        default:
            break;
        }

        return false;
    }

    function removePiece(cell) {
        var ret = cell.piece;
        if (ret !== null) {
            cell.piece = null;
            cell.ptype = 0;
            cell.removeChild(ret);
        }
        return ret;
    }

    function putPiece(x, y, type) {
        var pic = pics[type - 1];
        if (pic == undefined) return;
        var p = pic.cloneNode(true);
        p.ptype = type;
        p.moved = false;
        p.onmousedown = function() { click(this.cell); };
        putOnCell(cells[y][x], p);
    }

    function putOnCell(cell, p) {
        removePiece(cell);
        p.cell = cell;
        cell.piece = p;
        cell.ptype = p.ptype;
        cell.appendChild(p);
    }

    var debugNo = 0;

    function debug(line) {
        debugNo++;
        var text = '[' + debugNo + "] " + line;
        divd.insertBefore(document.createElement ("br"), divd.firstChild);
        divd.insertBefore(document.createTextNode(text), divd.firstChild);
    }
});
