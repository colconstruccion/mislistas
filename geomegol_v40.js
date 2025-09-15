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
let loc_x = 20;
let loc_y = 21;
//Definicio de gol
let gol_x = 610;
let gol_y = 100;
//marcador
let marcador = [0,0];
const marcador1 = document.getElementById("scoreTeam1");
const marcador2 = document.getElementById("scoreTeam2");
//instruciones
const instructionsCard = document.querySelector('.instructions-card');
// instructionsCard.classList.remove('is-hidden'); // show
// instructionsCard.classList.toggle('is-hidden'); // toggle
//Boton para mover la pelota
const moverBtn = document.getElementById('moverBtn');

//Coordenadas Previas
let prevCoor_x = 0;
let prevCoor_y = 0;

//posiciones del array
const posLocal = [];
const equipoLocal = [];

//Mensaje
const mensaje = document.getElementById("mensaje");

//pendiente
const out = document.getElementById('ballSlope');   // <output id="ballSlope">—</output>
const dyEl = document.getElementById('deltaY');
const dxEl = document.getElementById('deltaX');
const btn  = document.getElementById('moverBtn');
const line = document.getElementById('lineEquation');

//Coger los valores de las tablas
const players = document.querySelectorAll('.players input');
function resetCoor(){
  for (let counter = 0; counter < players.length; counter++){
    players[counter].value = "";
  }
}

function iniciarJuego(){
  //hacer el balon en la mita de la cancha
  ctx.beginPath();
  ctx.arc(canvas.width/2,canvas.height/2,5,0,2*Math.PI);
  ctx.strokStyle = "black";
  ctx.stroke();
  ctx.fillStyle = 'black';
  ctx.fill();
  balon_x.value = canvas.width/2;
  balon_y.value = canvas.height/2;
  dibujarArqueros();
}

function dibujarArqueros(){
    //hacer el portero del equipo local
  ctx.beginPath();
  ctx.arc(25,canvas.height/2,5,0,2*Math.PI);
  //ctx.strokStyle = "black";
  ctx.stroke();
  ctx.fillStyle = 'red';
  ctx.fill();
  players[20].value = 25;
  players[21].value = canvas.height/2;
  //hacer el portero del equipo visitante
  ctx.beginPath();
  ctx.arc(575,canvas.height/2,5,0,2*Math.PI);
  //ctx.strokStyle = "black";
  ctx.stroke();
  ctx.fillStyle = 'green';
  ctx.fill();
  players[42].value = 575;
  players[43].value = canvas.height/2;
}

function dibujarBalon(){
  let pecosa_x = balon_x.value;
  let pecosa_y = canvas.height - balon_y.value;
  ctx.beginPath();
  ctx.arc(pecosa_x,pecosa_y,5,0,2*Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'black';
  ctx.fill();
}

function dibujarPelotaSaque(temp_x,temp_y){
  ctx.beginPath();
  ctx.arc(temp_x,temp_y,5,0,2*Math.PI);
  ctx.strokeSyle = 'black';
  ctx.stroke();
  ctx.fillStyle = 'black';
  ctx.fill();
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
        let ocupada = revisarPosicion(coor_x,coor_y);
        if (ocupada == true){
          mensaje.innerHTML = "Amarilla para el equipo local <br>";
          ctx.beginPath();
          ctx.arc(coor_x,coor_y,5,0,2*Math.PI);
          ctx.strokeStyle = 'black';
          ctx.stroke();
          ctx.fillStyle = 'yellow';
          ctx.fill();
          balon_x.value = coor_x;
          balon_y.value = canvas.height - coor_y;
          pecosa_x = Number(balon_x.value);
          //balon_y.value es el valor que se muestra en el tablero
          //pecosa_y es el valor que se usa para dibujar el balon
          pecosa_y = canvas.height - Number(balon_y.value);
          players[k].value = "";
          players[i].value = "";
          //setTimeout(tiroLibre,3000);
          setTimeout(patearBalon,3000);
        }else{
          ctx.beginPath();
          ctx.arc(coor_x,coor_y,5,0,2*Math.PI);
          ctx.strokeStyle = 'black';
          ctx.stroke();
          ctx.fillStyle = 'red';
          ctx.fill();
          posLocal.push(coor_x);
          posLocal.push(coor_y);
        }
        
        //dibujar jugadores visitantes
        if (i == 1 && players[23].value.trim() === ""){
          iniciarVisitantes();
        }
      })
    }

    equipoLocal.push(posLocal);

}

//Recuperar el balon por el equipo local
function revisarPosicion(temp_x,temp_y){
  for (let k=22; k<players.length; k+=2){
      coor_x = players[k].value;
      if (coor_x !=0){
        let near_x = Math.abs(temp_x - coor_x);
        let j = k+1;
        coor_y = canvas.height - players[j].value;
        let near_y = Math.abs(temp_y - coor_y);
        if (near_x <= 5 && near_y <=5){
          console.log("esta cerca de en x del jugador visitante "+coor_x+" esta distancia "+near_x);
          console.log("esta cerca en y del jugador visitante "+coor_y+" esta distancia "+near_y);
          return true;
        }
      }
    }
}

function dibujarLocales(){
  for(let i=0;i<players.length/2;i++){
      if(i % 2 !== 0){
          let k = i - 1;
          let coor_y = canvas.height - players[i].value;
          let coor_x = players[k].value;
          if (coor_y != 0){
            ctx.beginPath();
            ctx.arc(coor_x,coor_y,5,0,2*Math.PI);
            ctx.stroke();
            ctx.fillStyle = 'red';
            ctx.fill();
          }
        }
      }
}


//dibujar los jugadores visitantes la primera vez
function iniciarVisitantes(){
  for(let i=22;i<players.length-2;i++){
    let min_y = (i<30) ? 25 : 10;
    let min_x = 0;
    let fieldWidth;
    if (i<30){
      fieldWidth =  canvas.width;
      min_x = 450
    }else if(i<38){
        min_x = 300;
        fieldWidth = canvas.width - 150;
    }else{
        min_x = 150;
        fieldWidth = canvas.width - 300;
    }

    let fieldHeight = (i<30) ? canvas.height -25 : canvas.height;
    if(i == 43){
      //hacer el portero del equipo visitante
      ctx.beginPath();
      ctx.arc(585,canvas.height/2,5,0,2*Math.PI);
      //ctx.strokStyle = "black";
      ctx.stroke();
      ctx.fillStyle = 'green';
      ctx.fill();
      players[42].value = 575;
      players[43].value = canvas.height/2;
    }else if(i % 2 !== 0){
          console.log('cuando i es '+i+' min_x es ' +min_x);
          console.log(min_y);
          let coor_y = Math.round(Math.random()*(fieldHeight-min_y) + min_y) ;
          let coor_x = Math.round(Math.random()*(fieldWidth-min_x) + min_x);
          let tempCoor_y = canvas.height-coor_y;
          //revisar posiciones de los visitantes
          let ocupada = revisarPosicion(coor_x,coor_y);
          if(ocupada == true){
            //undo the upcoming i++
            i--;
            continue;
          }
          let k = i - 1;
          ctx.beginPath();
          ctx.arc(coor_x,tempCoor_y,5,0,2*Math.PI);
          ctx.stroke();
          ctx.fillStyle = 'green';
          ctx.fill();
        //actualizar el valor del input de los visitantes
         players[k].value = coor_x.toFixed(2);
         players[i].value = coor_y.toFixed(2);
      }
  }
}

function dibujarVisitantes(){
  for(let i=22;i<players.length;i++){
      if(i % 2 !== 0){
          let k = i - 1;
          let coor_y = players[i].value;
          let coor_x = players[k].value;
          let tempCoor_y = canvas.height-coor_y;
          if (coor_y != 0){
            ctx.beginPath();
            ctx.arc(coor_x,tempCoor_y,5,0,2*Math.PI);
            ctx.stroke();
            ctx.fillStyle = 'green';
            ctx.fill();
          }
        }
      }
}

//se mueve el balon cuando se da click al boton mover balon
function moverBalon(){
    //Coger los valores de la pendiente
    const dy = parseFloat(dyEl.value) || 0;
    const dx = parseFloat(dxEl.value) || 0;
    
    //limpiar el canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);
    //Redo all players
    dibujarLocales();
    dibujarVisitantes();
    //Hacer la cancha
    drawGoalArea('left');
    drawGoalArea('right');
    drawCenterLineAndCircle();
     //pase entre jugadores del equipo local
    balonLocal = paseLocal(pecosa_x,pecosa_y);
    if (balonLocal == true){
      mensaje.innerHTML = fraseAleatoria();
      return;
    }
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
    //479 recuperarBalonVisitante()
    balonVisitante = recuperarBalonVisitante();
    if(balonVisitante == true){
      mensaje.innerHTML =  fraseDesviada();
      return;
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
          loc_x = 20;
          loc_y = 21;
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          moverBtn.classList.add('is-hidden');
          showAuxButton();
          flashColors(0.5);
          flashColors(3);
    }else if(pecosa_y <= 0 || pecosa_y >= canvas.height){
        mensaje.style.backgroundColor = "";
        mensaje.innerHTML = (pecosa_y <= 0) ? "Saque de banda del equipo visitante" : "Saque Lateral de los visitantes";
        saquedeBanda();
    }else if(0 > pecosa_x || pecosa_x >= canvas.width){
        mensaje.innerHTML = "Saque de meta del visitante";
         //saque de meta
         saquedeMeta();    
    }else if ( 0 < pecosa_x < canvas.width){
        mensaje.innerHTML = 'la posicion del balon en x es '+pecosa_x+'<br>';
        mensaje.innerHTML += "la posicion del balon en y es "+pecosa_y+"<br>";
        console.log("posicion del balon en x "+pecosa_x+" posicion del balon en y "+pecosa_y);
        console.log("delta x "+delta_x+" delta y "+delta_y);
        console.log("el balon esta en x entre 0 "+pecosa_x+" y "+canvas.width);
        mensaje.style.backgroundColor = "";
        requestAnimationFrame(moverBalon);
    }else{
        mensaje.innerHTML = fraseDesviada();
    }
    
}
//Termina la funcion moverBalon

//Dar click en el boton para mover el boton
document.getElementById('moverBtn').addEventListener('click',()=>{
    //obtener la posicion del balon
    balon_x = document.getElementById('ball-x');
    balon_y = document.getElementById('ball-y');
    pecosa_x = Number(balon_x.value);
    pecosa_y = canvas.height - Number(balon_y.value);
    //indices de los locales
    console.log("indice en x "+loc_x+"indice en y "+loc_y);
    console.log('coordenadas de la pelota '+ pecosa_x+' en y '+pecosa_y+" menos la altura del canvas ");
    instructionsCard.classList.add('is-hidden');      // hide instructions
    moverBalon();
})

function patearBalon(){
    //Coger los valores de la pendiente
    Idy = parseFloat(dyEl.value) || 0;
    Idx = parseFloat(dxEl.value) || 0;
    //limpiar el canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);
    //Hacer la cancha
    drawGoalArea('left');
    drawGoalArea('right');
    drawCenterLineAndCircle();
    //Redo all players
    dibujarLocales();
    dibujarVisitantes();
    //dibujar balon
    // se incremente la posicion horizontal y vertical
    pecosa_x -= Idx; 
    pecosa_y -= Idy;
    //se hace la bola moviendose
    ctx.beginPath();
    ctx.arc(pecosa_x,pecosa_y,5,0,2*Math.PI);
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.fill();
    //revisar que no este cerca de un jugado del equipo local
    let balonLocal = recuperarBalonLocal(pecosa_x,pecosa_y);
    if (balonLocal == true){
      mensaje.innerHTML = fraseAleatoria();
      return;
    }
    // Distancia al gol
    gol_delta_x = 10 - pecosa_x;
    gol_delta_y = 100 - pecosa_y;
    if (Math.abs(gol_delta_y) <= 25 && Math.abs(gol_delta_x) <= 10){
          mensaje.innerHTML = "GOL!!! GOL DEL VISITANTE!";
          balon_x.value = "";
          balon_y.value = "";
          marcador[1]++;
          marcador2.value = marcador[1];
          mensaje.style.backgroundColor = "BLUE";
          loc_x = 20;
          loc_y = 21;
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          moverBtn.classList.add('is-hidden');
          showAuxButton();
          flashColors(0.5);
          flashColors(3);
    }else if(pecosa_y <= 0 || pecosa_y >= canvas.height){
        balon_x.value = pecosa_x;
        balon_y.value = canvas.height - pecosa_y;
        console.log("se salio en las coordenadas x"+pecosa_x+" y la coordenada y "+pecosa_y);
        mensaje.innerHTML = "Saque de banda del equipo local";
    }else if(pecosa_x <= 0){
        mensaje.innerHTML = "Saque de meta del local";
        balon_x.value = 15;
        balon_y.value = canvas.height/2;
        loc_x = 20;
        loc_y = 21;
        balon_y.readOnly = false;
        balon_x.readOnly = false;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        //Redo all players
        dibujarLocales();
        iniciarVisitantes();
        //Hacer la cancha
        drawGoalArea('left');
        drawGoalArea('right');
        drawCenterLineAndCircle();
        dibujarPelotaSaque(25,100);
    }else if (pecosa_x > canvas.width){
        mensaje.innerHTML = "Saque de meta del visitante";
        pecosa_x = 575;
        pecosa_y = canvas.height/2;
        pecosa_x -= Idx; 
        pecosa_y -= Idy;
          balon_x.value = pecosa_x;
          balon_y.value = pecosa_y;
          loc_x = 20;
          loc_y = 21;
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          ctx.clearRect(0,0,canvas.width,canvas.height);
          //Redo all players
          dibujarLocales();
          iniciarVisitantes();
          //Hacer la cancha
          drawGoalArea('left');
          drawGoalArea('right');
          drawCenterLineAndCircle();
          dibujarPelotaSaque(pecosa_x,pecosa_y);
          requestAnimationFrame(patearBalon);
    }else{
        console.log("posicion del balon en x "+pecosa_x+" posicion del balon en y "+pecosa_y);
        mensaje.innerText = "posicion del balon en x "+pecosa_x+" posicion del balon en y "+pecosa_y;
        mensaje.style.backgroundColor = "";
        requestAnimationFrame(patearBalon);
    }
}

//Recuperar el balon por el equipo local
function recuperarBalonLocal(pecosa_x,pecosa_y){
  for (let k=0; k<players.length/2; k+=2){
      coor_x = players[k].value;
      if (coor_x !=0){
        let near_x = Math.abs(pecosa_x - coor_x);
        let j = k+1;
        coor_y = canvas.height - players[j].value;
        let near_y = Math.abs(pecosa_y - coor_y);
        if (near_x <= 5 && near_y <=5){
          console.log("esta cerca de en x del equipo local "+coor_x+" esta distancia "+near_x);
          console.log("esta cerca en y de "+coor_y+" esta distancia "+near_y);
          //mover la pelota al arco del local
          //resetear coordenadas del balon
          balon_x.value = pecosa_x;
          balon_y.value = canvas.height - pecosa_y;
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          dibujarBalon();
          return true;
        }
      }
    }
}

//pase entre locales
function paseLocal(pecosa_x,pecosa_y){
  for (let k=0; k<players.length/2; k+=2){
      coor_x = players[k].value;
      let j = k+1;
      if(loc_x == k && loc_y == j){
        console.log("esta en la posicion del arquero");
        console.log("j is"+j+"and k is"+k);
      }else if (coor_x !=0){
        let near_x = Math.abs(pecosa_x - coor_x);
        coor_y = canvas.height - players[j].value;
        let near_y = Math.abs(pecosa_y - coor_y);
        if (near_x <= 5 && near_y <=5){
          console.log("esta cerca de en x del equipo local "+coor_x+" esta distancia "+near_x);
          console.log("esta cerca en y de "+coor_y+" esta distancia "+near_y);
          //mover la pelota al arco del local
          //resetear coordenadas del balon
          balon_x.value = pecosa_x;
          balon_y.value = canvas.height - pecosa_y;
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          loc_x = k;
          loc_y = j;
          dibujarBalon();
          return true;
        }
      }
    }
}

function recuperarBalonVisitante(){
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
          //mover la pelota al arco del local
          patearBalon();
          balon_y.readOnly = false;
          balon_x.readOnly = false;
          return true;
        }
      }
    }
}

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
    const b = balon_y.value - ((dy / dx) * balon_x.value);
    if (b>0){
        let equation = 'y = '+m.toFixed(2)+'x + '+b.toFixed(2);
        line.textContent = equation;
    }else if(b == 0){
        let equation = 'y = '+m.toFixed(2)+'x';
        line.textContent = equation;
    }else if(m == 0){
        let equation = 'y ='+b.toFixed(2);
        line.textContent = equation;
    }
    else{
        let equation = 'y = '+m.toFixed(2)+'x '+b.toFixed(2);
        line.textContent = equation;
    }
    
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
    moverBtn.classList.remove('is-hidden');
    iniciarJuego();
    // resetear mensaje
    // reset back to the original gradient
      mensaje.style.background = "linear-gradient(180deg, #ffffff, #f7fbff)";
      mensaje.style.border = "1px solid #e6eef7";
      mensaje.style.borderLeft = "4px solid #5aa9e6";
      mensaje.style.borderRadius = "12px";
      mensaje.style.color = "#475569";
      mensaje.innerText = "Que ruede la pelota!!!";
  });

  
}
