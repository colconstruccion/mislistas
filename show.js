const golesAudio =  ['golA1.mp3','golA2.mp3','golRincon.wav','golTren.mp3','golTino.mp3','golCanteme.mp3'];


function coloresTablero() {
 return "#"+Math.random().toString(16).slice(-6);
}


function flashColors(seconds){
    let count = 0;
    const intervalId = setInterval(()=>{
        mensaje.style.background = coloresTablero();
        mensaje.style.color = "white";
        count++;

        if(count == 4){
            clearInterval(intervalId);
        }
    }, seconds * 1000);

    //Cantar el gol
    let cancion = Math.floor(Math.random()*7);
    let golAudio = new Audio("audio/"+golesAudio[cancion]); 
    golAudio.play();
    //let duration = golRincon.duration;
    //console.log(duration);
}
