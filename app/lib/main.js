const 
  fs = require('fs'),
  gc = require("./gcode"),
  serialPort = require('serialport'),
  config  = require('./config.json'),
  EventEmitter = require('events'),
  util = require('util')
;

var Arduino = {
  port : { comName : '' , manufacturer : ''},
  reSet
};

function getMiliSeg ()  {
  return config.motor.xy.steps * config.motor.xy.time / config.motor.xy.advance ;
}

var File = {
  gcode   : [],
  dir     : '' ,
  name    : 'Sin Archivo',
  lines   : 0 ,
  travel    : 0 ,
  segTotal  : 0
};
var arduino = {
  comName : Arduino.port.comName,
  manufacturer : Arduino.port.manufacturer,
  reSet : Arduino.reSet
};

function setFile ( dirfile ) {
  if (!dirfile){ return {}; }
  File.dir = dirfile[0];
  File.gcode = gc(fs.readFileSync(dirfile[0]).toString());
  File.name = dirfile[0].split('/')[dirfile[0].split('/').length-1];
  File.lines = File.gcode.length;
  File.travel = File.gcode[File.gcode.length-1].travel;
  File.segTotal = File.gcode[File.gcode.length-1].travel * getMiliSeg();
  return File;
  //cb(File) ;
}

function Line (code) {
  return { nro : '', type : 'none', ejes : [], steps : [], travel : '', code }
}

function sendCommand ( code , type ,cb ){
  //console.log(`${__filename}\n sendCommand, type: ${type}, code: ${code}`);
  if( Arduino.port.comName !== '' ){
    var line;
    switch (type) {
      case 'steps':
        line = Line(`Comando manual ${type}: ${code}`);
        line.steps = code.split(',');
        line.ejes = [
          line.steps[0] * config.motor.xy.advance / config.motor.xy.steps,
          line.steps[1] * config.motor.xy.advance / config.motor.xy.steps,
          line.steps[2] * config.motor.z.advance  / config.motor.z.steps
        ];
        realSendCommand( code , line );
        break;
      case 'mm':
        line = Line(`Comando manual ${type}: ${code}`);
        line.ejes = code.split(',');
        line.steps = [
          Math.round(line.ejes[0] * (config.motor.xy.steps / config.motor.xy.advance)),
          Math.round(line.ejes[1] * (config.motor.xy.steps / config.motor.xy.advance)),
          Math.round(line.ejes[2] * (config.motor.z.steps  / config.motor.z.advance))
        ];
        realSendCommand( line.steps[0]+','+line.steps[1]+','+line.steps[2] , line );
        break;
      default:
        realSendCommand( code , line , cb );
        break;
    }
  } else {
    console.error('sendCommand Arduino not selected');
    throw new Error('Arduino no seleccionado');
  }
}

function realSendCommand( code , line , callback ){
  if( Arduino.port.isOpen() ){ 
    Arduino.port.close(); 
  }
  Arduino.port.open( (err) => {
    Arduino.port.write(new Buffer(code+'\n'), (err) => {
      //req.io.broadcast('lineaGCode', line ); // emitir enviar lines procesada a app.js
      Arduino.port.drain( () => {
        Arduino.port.on('data', (data) => {
          Arduino.port.close( (err) => {
            if (typeof (callback) === 'function') {
              callback(data.toString());
            }
          });//close
        });//data
      });// drain
    });//write
  });//open
}


function reSet () {
  return new Promise(function (resolve, reject){
    serialPort.list( (err, ports) => {
      if(ports && ports.length > 0){
        Arduino.port = new serialPort.SerialPort(ports.slice(-1)[0].comName,{
          parser: serialPort.parsers.readline('\r\n'),
          dataBits: 8, 
          baudrate:9600,
          parity: 'none',
          stopBits: 1,
          flowControl: false
        },false);// This does not initiate the connection.
        console.info('Puerto Selecionado %s',ports.slice(-1)[0].manufacturer);
        resolve(ports.slice(-1)[0].manufacturer);
      }else{
        Arduino.port = { comName : '' , manufacturer : ''};
        console.warn('No Arduino.');
        resolve('');
      }
    });
  })// promise
}

//Arduino.reSet();
module.exports = {
  Arduino : arduino , File , Line , setFile , sendCommand
};




/*
function MyEmitter() {
  EventEmitter.call(this);
}
util.inherits(MyEmitter, EventEmitter);
const myEmitter = new MyEmitter();

myEmitter.on('Terminado', function() {
  console.log('Terminado');
});
myEmitter.on('Pausado', function() {
  console.log('Pausado');
});
*/