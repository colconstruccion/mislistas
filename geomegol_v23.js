//Geomegol
const canvas = document.querySelector('#myCanvas');
const ctx = canvas.getContext('2d');
//balon
let balon_x = document.getElementById('ball-x');
let balon_y = document.getElementById('ball-y');
balon_y.addEventListener('change',dibujarBalon)
//coordenadas iniciales del jugador
let obj_x = 0;
let obj_y = 0;
//index del array con las coordenadas de los jugadores
let loc_x = 0;
let loc_y = 1;
//Definicio de gol
let gol_x = 610;
let gol_y = 100;
//marcador
let marcador = [0,0];
const marcador1 = document.getElementById("scoreTeam1");
const marcador2 = document.getElementById("scoreTeam2");
const tablero = document.getElementById("mensaje");
//instruciones
const instructionsCard = document.querySelector('.instructions-card');

// instructionsCard.classList.remove('is-hidden'); // show
// instructionsCard.classList.toggle('is-hidden'); // toggle

//Coordenadas Previas
let prevCoor_x = 0;
let prevCoor_y = 0;

//posiciones del array
const posLocal = [];
const equipoLocal = [];

function dibujarBalon(){
  let pecosa_x = balon_x.value;
  let pecosa_y = canvas.height - balon_y.value;
  ctx.beginPath();
  ctx.arc(pecosa_x,pecosa_y,5,0,2*Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'black';
  ctx.fill();
}

function dibujarJugador(coor_x,coor_y,k,i){
  let visi_x = canvas.width - coor_x;
  let visi_y = canvas.height - coor_y;
  ctx.beginPath();
  ctx.arc(visi_x,visi_y,5,0,2*Math.PI);
  ctx.strokeSyle = 'black';
  ctx.stroke();
  ctx.fillStyle = 'green';
  ctx.fill();
  //actualizar el valor del input de los visitantes
  players[k+22].value = visi_x;
  players[i+22].value = coor_y;
}

//Mensaje
const mensaje = document.getElementById("mensaje");

//pendiente
const out = document.getElementById('ballSlope');   // <output id="ballSlope">—</output>
const dyEl = document.getElementById('deltaY');
const dxEl = document.getElementById('deltaX');
const btn  = document.getElementById('moverBtn');

//Coger los valores de las tablas
const players = document.querySelectorAll('.players input');
function resetCoor(){
  for (let counter = 0; counter < players.length; counter++){
    players[counter].value = "";
  }
}


// Dibujar los jugadores
for(let i=0; i < players.length / 2 ;i++){
  if (i % 2 === 0){
    players[i].addEventListener("click",function(){
      prevCoor_x = players[i].value;
      let j = i + 1;
      j = (j<players.length) ? j : 0;
      prevCoor_y = players[j].value;
      if (prevCoor_y !== "" && !isNaN(prevCoor_x)){
          console.log(prevCoor_x);
          console.log(prevCoor_y);
          tempCoor_y = canvas.height - prevCoor_y; //se resta de la altura del campo de juego
          ctx.beginPath();
          ctx.arc(prevCoor_x,tempCoor_y,5,0,2*Math.PI);
          ctx.fillStyle = 'white';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.stroke();
        }
    })
  }
    

    if(i % 2 !== 0){
      players[i].addEventListener("change",function(){
        let k = i - 1;
        let coor_y = canvas.height - players[i].value;
        let coor_x = players[k].value;
        ctx.beginPath();
        ctx.arc(coor_x,coor_y,5,0,2*Math.PI);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.fillStyle = 'red';
        ctx.fill();
        posLocal.push(coor_x);
        posLocal.push(coor_y);
        //dibujar jugadores visitantes
        dibujarJugador(coor_x,coor_y,k,i);
      })
    }

    equipoLocal.push(posLocal);

}


//const ani = {};
function moverBalon(){
     //Coger los valores de la pendiente
    const dy = parseFloat(dyEl.value) || 0;
    const dx = parseFloat(dxEl.value) || 0;
    
    //limpiar el canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);
    //Redo all players
    for(let i=0;i<players.length;i++){
      if(i % 2 !== 0){
          let k = i - 1;
          let coor_y = canvas.height - players[i].value;
          let coor_x = players[k].value;
          if (coor_y != 0){
            ctx.beginPath();
            ctx.arc(coor_x,coor_y,5,0,2*Math.PI);
            ctx.stroke();
            ctx.fillStyle = (i > 21) ? 'green' : 'red';
            ctx.fill();
          }
        }
      }
    //Hacer la cancha
    drawGoalArea('left');
    drawGoalArea('right');
    drawCenterLineAndCircle();
    // se incremente la posicion horizontal y vertical
    pecosa_x +=dx; 
    pecosa_y -=dy;
    //se hace la bola moviendose
    ctx.beginPath();
    ctx.arc(pecosa_x,pecosa_y,5,0,2*Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fill();

    //revisar que no este cerca de un balon del contricante
    for (let k=22; k<players.length; k+=2){
      coor_x = players[k].value;
      if (coor_x !=0){
        let near_x = Math.abs(pecosa_x - coor_x);
        let j = k+1;
        coor_y = canvas.height - players[j].value;
        let near_y = Math.abs(pecosa_y - coor_y);
        if (near_x <= 5 && near_y <=5){
          console.log("esta cerca de en x del 2do equipo "+coor_x+" esta distancia "+near_x);
          console.log("esta cerca en y de "+coor_y+" esta distancia "+near_y);
          mensaje.innerHTML = "GOL!!! GOL DEL VISITANTE!"
          marcador[1]++;
          marcador2.value = marcador[1];
          tablero.style.backgroundColor = "BLUE";
          loc_x = 0;
          loc_y = 1;
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          showAuxButton();
          return;
        }
      }
    }

    //distancia entre balon y objectivo
    let delta_x = pecosa_x - obj_x;
    let delta_y = pecosa_y - obj_y;
    // Distancia al gol
    let gol_delta_x = gol_x - pecosa_x;
    let gol_delta_y = gol_y - pecosa_y;
    //primero reviso si es gol
    if (Math.abs(gol_delta_y) <= 25 && Math.abs(gol_delta_x) <= 10){
          mensaje.innerHTML = "GOL!!! GOL DEL LOCAL!";
          balon_x.value = "";
          balon_y.value = "";
          marcador[0]++;
          marcador1.value = marcador[0];
          tablero.style.backgroundColor = "RED";
          loc_x = 0;
          loc_y = 1;
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          showAuxButton();
    }else if(Math.abs(delta_y) > canvas.height || Math.abs(delta_x) > canvas.width){
        mensaje.innerHTML = "distancia entre el balon y el jugador en y es "+delta_y+"<br>";
        mensaje.innerHTML += "distancia entre el balon y el jugador en x es "+delta_x+"<br>";
    }else if (Math.abs(delta_x) >= 5 && Math.abs(delta_y) >= 5){
        mensaje.innerHTML = 'la distancia entre el balon y el jugador en x es '+delta_x+'<br>';
        mensaje.innerHTML += "distancia entre el balon y el jugador en y es "+delta_y+"<br>";
        console.log("posicion del balon en x "+pecosa_x+" posicion del balon en y "+pecosa_y);
        console.log("delta x "+delta_x+" delta y "+delta_y);
        console.log("Distancia al gol en x "+gol_delta_x+" Distancia al gol en y "+gol_delta_y);
        tablero.style.backgroundColor = "";
        requestAnimationFrame(moverBalon);
    }else if(Math.abs(delta_x) < 5 && Math.abs(delta_y) < 5 ){
        balon_x.value = pecosa_x;
        balon_y.value = canvas.height - pecosa_y;
        mensaje.innerHTML = fraseAleatoria();
        balon_y.readOnly = true;
        balon_x.readOnly = true;
    }else if(Math.abs(delta_y) < 5){
        requestAnimationFrame(moverBalon);
    }else if(Math.abs(delta_x) < 5){
        requestAnimationFrame(moverBalon);
    }
    else{
        mensaje.innerHTML = fraseDesviada();
    }
    
}


document.getElementById('moverBtn').addEventListener('click',()=>{
    //cancelAnimationFrame(ani.mover);
    balon_x = document.getElementById('ball-x');
    balon_y = document.getElementById('ball-y');
    pecosa_x = Number(balon_x.value);
    pecosa_y = canvas.height - Number(balon_y.value);
    //Obterner la posicion de los siguientes jugadores
    obj_x = Number(players[loc_x].value);
    play_y = Number(players[loc_y].value);
    obj_y = canvas.height - Number(players[loc_y].value);
    //delta con objectivo
    delta_x = pecosa_x - obj_x;
    delta_y = pecosa_y - obj_y;
    if (Math.abs(delta_x) < 5  && Math.abs(delta_y) < 5){
        loc_x = loc_x + 2;
        loc_y = loc_y + 2;
        obj_x = Number(players[loc_x].value);
        obj_y = canvas.height - Number(players[loc_y].value);
    }
    console.log('delta  x '+delta_x+' delta y '+delta_y);
    console.log('coordenada del siguiente jugador en x '+ obj_x+' en y '+play_y+"menos la altura del canvas "+obj_y);
    instructionsCard.classList.add('is-hidden');      // hide instructions
    moverBalon();
})

//actualizar pendiente
function updateSlope() {
  const dy = parseFloat(dyEl.value) || 0;
  const dx = parseFloat(dxEl.value) || 0;

  if (Math.abs(dx) < 1e-9) {
    out.textContent = 'Vertical (∞)';   // undefined slope
  } else {
    const m = dy / dx;                  // canvas note: y+ is down
    out.textContent = m.toFixed(2);
    // If you want mathematical slope with y up, use: (-dy / dx).toFixed(2)
  }
}


btn.addEventListener('click', updateSlope);
// Optional: update live as values change
dyEl.addEventListener('input', updateSlope);
dxEl.addEventListener('input', updateSlope);

//boton de reseto
function showAuxButton() {
  // Create a real node; don't use appendChild with an HTML string
  const reset = document.createElement('button');
  reset.id = 'resetBtn';
  reset.type = 'button';
  reset.textContent = 'Reposicionar Jugadores';
  reset.className = 'aux-btn';

  // Put it NEXT TO the mover button
  btn.insertAdjacentElement('afterend', reset);

  // Hide/remove after pressing it
  reset.addEventListener('click', () => {
    //limpiar el canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);
    //Hacer la cancha
    drawGoalArea('left');
    drawGoalArea('right');
    drawCenterLineAndCircle();
    //resetear coordenadas
    resetCoor();
    reset.remove();
  });
}