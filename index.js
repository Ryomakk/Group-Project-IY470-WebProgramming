function toggleNav() {
    const mySidenav = document.getElementById('mySidenav');
    const main = document.getElementById('main');
    if (mySidenav.style.width === '250px') {
        mySidenav.style.width = '0';
        main.style.marginLeft = '0';
    } else {
        mySidenav.style.width = '250px';
        main.style.marginLeft = '250px';
    }
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

function bigfont() { document.getElementById("big").style.fontSize = "40px"; }
function normalfont(x) { x.style.fontSize = "25px"; }
function bigfont2(y) { y.style.fontSize = "40px"; }
function bigfont3(z) { z.style.fontSize = "40px"; }
function bigfont4(a) { a.style.fontSize = "40px"; }

// Close Sidebar
document.addEventListener("click", function(event) {
    const sidenav = document.getElementById("mySidenav");
    const main = document.getElementById("main");

    if (sidenav.style.width === "250px") {
        if (!sidenav.contains(event.target)) {
            sidenav.style.width = "0";
            main.style.marginLeft = "0";
        }
    }
});
