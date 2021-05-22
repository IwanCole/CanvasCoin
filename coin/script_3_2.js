/*jslint browser: true */
/*global screen $ innerWidth innerHeight navigator document*/

var WIDTH = null;
var HEIGHT = null;
var canvas = document.querySelector("canvas");
var ctx = canvas.getContext('2d');
var coins = [];
var gScore;
var difficulty;

var interval_coin = null;
var interval_clean = null;
var interval_coin2 = null;
var interval_coin3 = null;
var c1 = document.querySelector("#c1");
var c2 = document.querySelector("#c2");
var c3 = document.querySelector("#c3");


function Coin(x, y, type) {
    this.x = x;         // X-pos
    this.y = y;         // Y-pos
    this.v = 0;         // Coin velocity
    this.hit = false;   // Coin has been hit
    this.type = type;   // Coin type (points gained when hit)
    this.spriteN = 0;   // Sprite rotation index
    this.sprite = (type == 1) ? c1 : ((type == 5) ? c2 : c3);       // Sprite ID
    this.speed = (type == 1) ? 0.2 : ((type == 5) ? 0.3 : 0.35);    // Coin speed increase
    this.spriteMode = (difficulty > 1) ? 0.5 : 0.3;

    this.draw = function() {
        if (!this.hit) ctx.drawImage(this.sprite, (Math.floor(this.spriteN)*32), 0, 32, 32, this.x-50, this.y-50, 100, 100);
    }

    this.update = function() {
        this.v += this.speed*difficulty;
        this.y += this.v;
        this.y = Math.round(this.y);
        this.spriteN += this.spriteMode;
        this.spriteN %= 10;     // Sprite has 10 frames
        this.draw();
    }
}

function spawnCoin(type) {
    var offset = Math.floor(Math.random() * 10) + 1;
    var x = Math.floor((WIDTH/10) * offset);
    if (x >= WIDTH) x -= 80;
    coins.push(new Coin(x, -75, type))
}

// More efficient for removing old coins; Deleting them per-coin causes the canvas to flicker
// Removing them in bulk doesn't cause this glitch
function cleanup() {
    coins = coins.filter(coin => coin !== null);
}


function animate() {
    var req = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (var i = 0; i < coins.length; i++) {
        if (coins[i]) {
            coins[i].update();
            if (coins[i].y > HEIGHT+100) coins[i] = null;
        }
    }
}


window.addEventListener('touchmove', (e) => {
    e.preventDefault();
});


function tap(e) {
    for (var i = 0; i < coins.length; i++) {
        if (coins[i]) {
            if (e.y >= coins[i].y-120 && e.y <= coins[i].y+75 && e.x >= coins[i].x-75 && e.x <= coins[i].x+75) {
                coins[i].hit = true;
                gScore += coins[i].type;
                updateScore();
                // break; Allows hit of multiple overlapping coins
            }
        }
    }
}


function switchTheme() {
    var page = document.querySelector("html");
    page.classList.toggle("theme2");

    var colour = (page.classList.contains("theme2")) ? "#2e2e2e" : "#fdd039";
    var meta = document.querySelector("meta[name='theme-color']");
    meta.setAttribute("content", colour);
    meta = document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']");
    meta.setAttribute("content", colour);
}

function setHighScore(value) {
    document.cookie = `scoreV2=${value}; expires=Sat, 31 Dec 2050 23:59:59 GMT`;
}


function getHighScore() {
    /* Cleanup of old cookies: this is a temp thing */
    document.cookie = "hScore=;expires=Thu, 01 Jan 1970 00:00:01 GMT"
    document.cookie = "hScore2=;expires=Thu, 01 Jan 1970 00:00:01 GMT"
    /* Can remove the above after a while */

    if (document.cookie.indexOf("scoreV2") === -1) return 0;
    return parseInt(document.cookie.slice(document.cookie.indexOf("scoreV2")).split("=")[1])
}

function highScore() {
    var currentHighScore = getHighScore();
    if (gScore > currentHighScore) setHighScore(gScore);
    var score = document.querySelector(".game-high-score");
    score.innerHTML = `High Score: ${getHighScore()}`;
}

function updateScore() {
    var score = document.querySelector(".game-score");
    score.textContent = `Score: ${gScore}`;
    score.classList.toggle("game-score-pulse");
    setTimeout(() => { score.classList.toggle("game-score-pulse"); }, 200);
}


function tick(t) {
    setTimeout(() => {
        t = t - 1;
        $(".game-time").text(t);
        if (t === 0) {
            setTimeout( () => {
                $(".game-time").fadeOut(300);
            }, 1000);
            return;
        }
        tick(t);
    }, 1000);
}

function timer() {
    $(".game-time").delay(1100).fadeIn(200);
    tick(31);
    setTimeout( () => {
        endGame();
        $(".info-box-main").delay(2500).fadeIn(200);
    }, 31500);
}


function startGame() {
    gScore = 0;
    updateScore();
    timer();

    $(".game-high-score").fadeOut(200);

    interval_coin = setInterval( () => {spawnCoin(1);}, 300);
    interval_coin2 = setInterval( () => {spawnCoin(5);}, 3000);
    interval_clean = setInterval( () => {cleanup();}, 4000);

    // Super coin has 15% chance of spawning
    interval_coin3 = setInterval( () => {
        if (Math.random() > 0.85) spawnCoin(69);
    }, 9000);
}


function endGame() {
    clearInterval(interval_coin);
    clearInterval(interval_coin2);
    clearInterval(interval_coin3);
    clearInterval(interval_clean);
    interval_coin = null;
    interval_coin2 = null;
    interval_coin3 = null;
    interval_clean = null;
    setTimeout( () => {
        highScore();
        sendScore();
    }, 2500);

    if (typeof ga !== "undefined")
    {
        ga('send', 'event', 'game', 'end', 'score', `${gScore}`);
    }

    $(".game-high-score").delay(2500).fadeIn(200);
}

function sendScore() {

    var payload = {
        userId: localStorage.getItem("userId"),
        score: gScore,
        mode: `${(difficulty > 1) ? 1 : 0}`
    };

    $.ajax({
        type: "POST",
        url: "https://k9vradv5x9.execute-api.eu-west-2.amazonaws.com/thtc",
        headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Access-Control-Allow-Origin" : '*',
        },
        data: JSON.stringify(payload),
        success: function(d, s) {
            console.log(s);
            console.log(d);
        }
    })
}


function initUser() {
    var existing = localStorage.getItem("userId");
    if (existing) return;
    var d = new Date();
    var user = `${Math.floor(Math.random() * 10)}_${d.getTime()}`;
    localStorage.setItem("userId", user);
}


function init() {
    if (mobileCheck()) {
        window.addEventListener('touchstart', (e) => {
            tap({x: e.changedTouches[0].pageX, y: e.changedTouches[0].pageY});
        });
    }
    else {
        window.addEventListener('mousedown', (e) => {
            tap(e);
        });
    }

    if (document.cookie.indexOf("scoreV2") === -1) setHighScore(0);
    gScore = 0;

    var currentHighScore = getHighScore();

    initUser();

    $(".game-high-score").text(`High Score: ${currentHighScore}`);

    $(".info-btn-alert").on('click', () => {
        $(".alert-box").fadeOut(200);
        $(".alert-box > .info-box-main").fadeOut(200);
    });

    $(".info-btn-theme").on('click', () => {
        switchTheme();
    });

    $(".info-btn-start").on('click', () => {
        $(".info-box-main").fadeOut(200);
        $(".info-box-difficulty").delay(200).fadeIn(200);
    });

    $(".info-btn-calm").click((e) => {
        $(e.target.parentElement).fadeOut(200);
        difficulty = 0.8;
        startGame();
    });

    $(".info-btn-crazy").click((e) => {
        $(e.target.parentElement).fadeOut(200);
        difficulty = 2.0;
        startGame();
    });
}


if ( navigator.platform != "iPad" && navigator.platform != "iPhone" && navigator.platform != "iPod" ) {
    HEIGHT = innerHeight+60; // Accounts for navbar on mobile blocking canvas
    WIDTH = innerWidth;
} else {
    HEIGHT = screen.height;
    WIDTH = screen.width;
}
canvas.width = WIDTH;
canvas.height = HEIGHT;

init();

var req = requestAnimationFrame(animate);
