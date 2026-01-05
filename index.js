
function toggleNav(){       //sets a function called toggleNav() execute when called
const mySidenav = document.getElementById('mySidenav')  //if the element has the id mysidenav it will execute
const main = document.getElementById('main') //if the element has the id main it will execute
if (mySidenav.style.width === '250px'){     //if the sidenavbar width is 200px wide ]
  //then close the sidenavbar by setting width to 0 and marginleft makes it go to the original settings.it closes the side nav bar
  mySidenav.style.width = '0'
  main.style.marginLeft = '0'
}
else{    //if 200px isnt met which means the sidebar is not yet opened it will open up the sidebar
  mySidenav.style.width = '250px'
  main.style.marginLeft = '250px'
}
}
function closeNav() {   //sets a function called closeNav() execute when it is called
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}


function bigfont(){
  let big = document.getElementById("big").style.fontSize = "40px";
}
function normalfont(x){
  x.style.fontSize = "25px";
}
function bigfont2(y){
  y.style.fontSize = "40px";
}
function bigfont3(z){
  z.style.fontSize = "40px";
}
function bigfont4(a){
  a.style.fontSize = "40px";
}


