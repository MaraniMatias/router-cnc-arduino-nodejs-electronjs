app.controller('TodoListController',['addMessage','pUSB','$http','$scope',
function(addMessage,pUSB,$http,$scope){
  $scope.inputpasosmm='200';
  var varpasosmm = 'pasos';
  $scope.setmmpass=function(valor){varpasosmm=valor;}
  $scope.SelecArduino="Selec Arduino";

addMessage('menssaje','titulo')

  $scope.codeArchivo = '';
  $scope.codeEjecutado=0;
  $scope.codeTotal=0;
  $scope.horaInicio=Date.now();

  $scope.setFile = function(element) {
    $scope.$apply(function($scope) {
      $scope.codeArchivo  = element.files[0];
      // llamar a funciones para acomodar lineas totales
      // y indacar a node.js el archvio estilo a la funcion udatefile
    });
  };



  $scope.moverManual=function(nume,eje,sentido){
    var str = undefined;
    switch (eje) {
      case "X": str= "["+sentido+nume+",0,0]"; break;
      case "Y": str = "[0,"+sentido+nume+",0]"; break;
      case "Z": str = "[0,0,"+sentido+nume+"]"; break;
      default:  str ="[0,0,0]" ; break;
    }
    if($scope.pUSB!=''){
      $http({ url: "/comando",method: "POST",data: {comando : str}
      }).success(function(data, status, headers, config) {
        console.log('success comando',data);
      }).error(function(data, status, headers, config) {
        console.log('error comando',data);
      });
    }else{
      console.log("Select puerto");
    }
  }

  $scope.enviarDatos=function(comando){
    if($scope.pUSB!=''){
      $scope.comando='';
      console.log("comando %s",comando);
      $http({ url: "/comando",method: "POST",data: {comando : comando}
      }).success(function(data, status, headers, config) {
        console.log('success comando',data);
      }).error(function(data, status, headers, config) {
        console.log('error comando',data);
      });
    }else{
      console.log("Select puerto");
    }
  }
  $scope.moverOrigen=function(){
    if($scope.pUSB!=''){
      $http({ url: "/moverOrigen",method: "POST",data: {}
      }).success(function(data, status, headers, config) {
        console.log('success comando',data);
      }).error(function(data, status, headers, config) {
        console.log('error comando',data);
      });
    }else{
      console.log("Select puerto");
    }
  }
  $scope.setUSB=function(port){
    $scope.pUSB = port.comName;
    $scope.SelecArduino = port.manufacturer;
    if($scope.pUSB!=''){
    $http({ url: "/conect",method: "POST",
      data: {comUSB : port.comName}
    }).success(function(data, status, headers, config) {
      console.log('success conect',data);
    }).error(function(data, status, headers, config) {
      console.log('error conect',data);
    });
    }else{
      console.log("Select puerto");
    }
  }
  $scope.$on('updateUSB',function(){
    $http.get('/portslist').success(function (data) {
      if(data){
        $scope.port=data;
      }else{
        $scope.port=[];
      }
    });
  });
$scope.$emit('updateUSB');
//######################

//$scope.ejeXposicion = 0.000;
//$scope.ejeYposicion = 0.000;
//$scope.ejeZposicion = 0.000;

}])
.controller("message",['alerts','addMessage','$scope','$interval', '$http',
              function(alerts,addMessage,$scope,$interval,$http){
// # message alert
  $scope.alerts=alerts;
  $scope.addAlert = function(type,msg,header,list) {
    addMessage(type,msg,header,list);
  };
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
}])
// # message alert //ver getuikit.com/docs/notify.html
.factory('addMessage', ['alerts',function(alerts) {
  return function(msg,header,type) {
    switch(type){
      case 1: type='info';break;case 2: type='success';break;
      case 3: type='warning';break;case 4: type='negative';break;
      case 5: type='black';break;default:type='';
    }
    alerts.push({type:type,header:header, msg:msg});
  };
}])

.controller('HomeCtrl', ['$scope', 'upload', function ($scope, upload){
  $scope.uploadFile = function(){
    var file = $scope.file;
    upload.uploadFile(file).then(function(res){
      console.log(res.data);
    })
  }
}])

.directive('uploaderModel', ["$parse", function ($parse) {
  return {
    restrict: 'A',
    link: function (scope, iElement, iAttrs){
      iElement.on("change", function(e){
        $parse(iAttrs.uploaderModel).assign(scope, iElement[0].files[0]);
      });
    }
  };
}])

.service('upload', ["$http", "$q", function ($http, $q){
  this.uploadFile = function(file){
    var deferred = $q.defer();
    var formData = new FormData();
    formData.append("file", file);
    return $http.post("/cargarGCODE", formData, {
      headers: {
        "Content-type": undefined
      },
      transformRequest: angular.identity
    })
    .success(function(res){
      deferred.resolve(res);
    })
    .error(function(msg, code){
      deferred.reject(msg);
    })
    return deferred.promise;
  }
}])

io.emit('sign up',$('#from').val());
$('#from').on('change',function(){
  console.log('sign up from '+ $('#from').val());
  io.emit('sign up',$('#from').val());
})

$('form').submit(function(){
  var msg={
    from:$('#from').val(),
    to:$('#to').val(),
    txt:$('#m').val(),
    time:new Date()
  };
  console.log('send message: ' + msg.txt + ' from ' + msg.from + ' to ' + msg.to);
  $('#messages').append($('<li>').text($('#m').val() + ' by me @ '+ new Date()));

  comment = {msj:$('#m').val(),by : 'me',time:new Date()};
  console.log(comment);

  io.emit('chat message', msg);
  $('#m').val('');
  return false;
});
io.on('chat message', function(msg){
  console.log('Receive message: ' + msg.txt + ' from ' + msg.from + ' to ' + msg.to);
  if(msg.to==$('#from').val()) {
    $('#messages').append($('<li>').text(msg.txt + ' by ' + msg.from + ' @: ' +msg.time));
  }
});