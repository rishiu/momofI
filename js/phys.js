Physics.behavior('interactive-weights', function( parent ){

    if ( !document ){
        // must be in node environment
        return {};
    }

    var defaults = {
            // the element to monitor
            el: null,
            // time between move events
            moveThrottle: 1000 / 100 | 0,
            // minimum velocity clamp
            minVel: { x: -5, y: -5 },
            // maximum velocity clamp
            maxVel: { x: 5, y: 5 }
        }
        ,getElementOffset = function( el ){
            var curleft = 0
                ,curtop = 0
                ;

            if (el.offsetParent) {
                do {
                    curleft += el.offsetLeft;
                    curtop += el.offsetTop;
                } while (el = el.offsetParent);
            }

            return { left: curleft, top: curtop };
        }
        ,getCoords = function( e ){
            var offset = getElementOffset( e.target )
                ,obj = ( e.changedTouches && e.changedTouches[0] ) || e
                ,x = obj.pageX - offset.left
                ,y = obj.pageY - offset.top
                ;

            return {
                x: x
                ,y: y
            };
        }
        ;

    return {
        // extended
        init: function( options ){

            var self = this
                ,prevTreatment
                ,time
                ;

            // call parent init method
            parent.init.call( this );
            this.options.defaults( defaults );
            this.options( options );

            // vars
            this.mousePos = new Physics.vector();
            this.mousePosOld = new Physics.vector();
            this.offset = new Physics.vector();

            this.el = typeof this.options.el === 'string' ? document.getElementById(this.options.el) : this.options.el;

            if ( !this.el ){
                throw "No DOM element specified";
            }

            // init events
            var grab = function grab( e ){
                var pos = getCoords( e )
                    ,body
                    ;

                time = Physics.util.ticker.now();

                if ( self._world ){
                    body = self._world.findOne({ $at: new Physics.vector( pos.x, pos.y ), $in: self.getTargets() });



                    if ( body ){
                        // we're trying to grab a body

                        // fix the body in place
                        prevTreatment = body.treatment;
                        body.treatment = 'kinematic';
                        body.state.vel.zero();
                        body.state.angular.vel = 0;
                        // remember the currently grabbed body
                        self.body = body;
                        // remember the mouse offset
                        self.mousePos.clone( pos );
                        self.mousePosOld.clone( pos );
                        self.offset.clone( pos ).vsub( body.state.pos );

                        pos.body = body;
                        self._world.emit('interact:grab', pos);

                    } else {

                        self._world.emit('interact:poke', pos);
                    }
                }
            };

            var move = Physics.util.throttle(function move( e ){
                var pos = getCoords( e )
                    ,state
                    ;

                if ( self.body ){
                    time = Physics.util.ticker.now();

                    self.mousePosOld.clone( self.mousePos );
                    // get new mouse position
                    self.mousePos.set(pos.x, pos.y);

                    pos.body = self.body;
                }

                self._world.emit('interact:move', pos);

            }, self.options.moveThrottle);

            var release = function release( e ){
                var pos = getCoords( e )
                    ,body
                    ,dt = Math.max(Physics.util.ticker.now() - time, self.options.moveThrottle)
                    ;

                // get new mouse position
                self.mousePos.set(pos.x, pos.y);

                // release the body
                if (self.body){
                    self.body.treatment = prevTreatment;
                    // calculate the release velocity
                    self.body.state.vel.clone( self.mousePos ).vsub( self.mousePosOld ).mult( 1 / dt );
                    // make sure it's not too big
                    self.body.state.vel.clamp( self.options.minVel, self.options.maxVel );
                    self.body = false;
                }

                if ( self._world ){

                    self._world.emit('interact:release', pos);
                    self._world.emit('interact-weight:release',pos);
                }
            };

            this.el.addEventListener('mousedown', grab);
            this.el.addEventListener('touchstart', grab);

            this.el.addEventListener('mousemove', move);
            this.el.addEventListener('touchmove', move);

            this.el.addEventListener('mouseup', release);
            this.el.addEventListener('touchend', release);
        },

        // extended
        connect: function( world ){

            // subscribe the .behave() method to the position integration step
            world.on('integrate:positions', this.behave, this);
        },

        // extended
        disconnect: function( world ){

            // unsubscribe when disconnected
            world.off('integrate:positions', this.behave);
        },

        // extended
        behave: function( data ){

            var self = this
                ,state
                ,dt = Math.max(data.dt, self.options.moveThrottle)
                ;

            if ( self.body ){

                // if we have a body, we need to move it the the new mouse position.
                // we'll do this by adjusting the velocity so it gets there at the next step
                state = self.body.state;
                state.vel.clone( self.mousePos ).vsub( self.offset ).vsub( state.pos ).mult( 1 / dt );
            }
        }
    };
});

Physics.behavior('interactive-masses', function( parent ){

    if ( !document ){
        // must be in node environment
        return {};
    }

    var defaults = {
            // the element to monitor
            el: null,
            // time between move events
            moveThrottle: 1000 / 100 | 0,
            // minimum velocity clamp
            minVel: { x: -5, y: -5 },
            // maximum velocity clamp
            maxVel: { x: 5, y: 5 }
        }
        ,getElementOffset = function( el ){
            var curleft = 0
                ,curtop = 0
                ;

            if (el.offsetParent) {
                do {
                    curleft += el.offsetLeft;
                    curtop += el.offsetTop;
                } while (el = el.offsetParent);
            }

            return { left: curleft, top: curtop };
        }
        ,getCoords = function( e ){
            var offset = getElementOffset( e.target )
                ,obj = ( e.changedTouches && e.changedTouches[0] ) || e
                ,x = obj.pageX - offset.left
                ,y = obj.pageY - offset.top
                ;

            return {
                x: x
                ,y: y
            };
        }
        ;

    return {
        // extended
        init: function( options ){

            var self = this
                ,prevTreatment
                ,time
                ;

            // call parent init method
            parent.init.call( this );
            this.options.defaults( defaults );
            this.options( options );

            // vars
            this.mousePos = new Physics.vector();
            this.mousePosOld = new Physics.vector();
            this.offset = new Physics.vector();

            this.el = typeof this.options.el === 'string' ? document.getElementById(this.options.el) : this.options.el;

            if ( !this.el ){
                throw "No DOM element specified";
            }

            // init events
            var grab = function grab( e ){
                var pos = getCoords( e )
                    ,body
                    ;

                time = Physics.util.ticker.now();

                if ( self._world ){
                    body = self._world.findOne({ $at: new Physics.vector( pos.x, pos.y ), $in: self.getTargets() });



                    if ( body ){
                        // we're trying to grab a body

                        // fix the body in place
                        prevTreatment = body.treatment;
                        body.treatment = 'kinematic';
                        body.state.vel.zero();
                        body.state.angular.vel = 0;
                        // remember the currently grabbed body
                        self.body = body;
                        // remember the mouse offset
                        self.mousePos.clone( pos );
                        self.mousePosOld.clone( pos );
                        self.offset.clone( pos ).vsub( body.state.pos );

                        pos.body = body;
                        self._world.emit('interact:grab', pos);

                    } else {

                        self._world.emit('interact:poke', pos);
                    }
                }
            };

            var move = Physics.util.throttle(function move( e ){
                var pos = getCoords( e )
                    ,state
                    ;

                if ( self.body ){
                    time = Physics.util.ticker.now();

                    self.mousePosOld.clone( self.mousePos );
                    // get new mouse position
                    self.mousePos.set(pos.x, pos.y);

                    pos.body = self.body;
                }

                self._world.emit('interact:move', pos);

            }, self.options.moveThrottle);

            var release = function release( e ){
                var pos = getCoords( e )
                    ,body
                    ,dt = Math.max(Physics.util.ticker.now() - time, self.options.moveThrottle)
                    ;

                // get new mouse position
                self.mousePos.set(pos.x, pos.y);

                // release the body
                if (self.body){
                    self.body.treatment = prevTreatment;
                    // calculate the release velocity
                    self.body.state.vel.clone( self.mousePos ).vsub( self.mousePosOld ).mult( 1 / dt );
                    // make sure it's not too big
                    self.body.state.vel.clamp( self.options.minVel, self.options.maxVel );
                    self.body = false;
                }

                if ( self._world ){

                    self._world.emit('interact:release', pos);
                    self._world.emit('interact-masses:release',pos);
                }
            };

            this.el.addEventListener('mousedown', grab);
            this.el.addEventListener('touchstart', grab);

            this.el.addEventListener('mousemove', move);
            this.el.addEventListener('touchmove', move);

            this.el.addEventListener('mouseup', release);
            this.el.addEventListener('touchend', release);
        },

        // extended
        connect: function( world ){

            // subscribe the .behave() method to the position integration step
            world.on('integrate:positions', this.behave, this);
        },

        // extended
        disconnect: function( world ){

            // unsubscribe when disconnected
            world.off('integrate:positions', this.behave);
        },

        // extended
        behave: function( data ){

            var self = this
                ,state
                ,dt = Math.max(data.dt, self.options.moveThrottle)
                ;

            if ( self.body ){

                // if we have a body, we need to move it the the new mouse position.
                // we'll do this by adjusting the velocity so it gets there at the next step
                state = self.body.state;
                state.vel.clone( self.mousePos ).vsub( self.offset ).vsub( state.pos ).mult( 1 / dt );
            }
        }
    };
});

Physics.behavior('interactive-spheres', function( parent ){

    if ( !document ){
        // must be in node environment
        return {};
    }

    var defaults = {
            // the element to monitor
            el: null,
            // time between move events
            moveThrottle: 1000 / 100 | 0,
            // minimum velocity clamp
            minVel: { x: -5, y: -5 },
            // maximum velocity clamp
            maxVel: { x: 5, y: 5 }
        }
        ,getElementOffset = function( el ){
            var curleft = 0
                ,curtop = 0
                ;

            if (el.offsetParent) {
                do {
                    curleft += el.offsetLeft;
                    curtop += el.offsetTop;
                } while (el = el.offsetParent);
            }

            return { left: curleft, top: curtop };
        }
        ,getCoords = function( e ){
            var offset = getElementOffset( e.target )
                ,obj = ( e.changedTouches && e.changedTouches[0] ) || e
                ,x = obj.pageX - offset.left
                ,y = obj.pageY - offset.top
                ;

            return {
                x: x
                ,y: y
            };
        }
        ;

    return {
        // extended
        init: function( options ){

            var self = this
                ,prevTreatment
                ,time
                ;

            // call parent init method
            parent.init.call( this );
            this.options.defaults( defaults );
            this.options( options );

            // vars
            this.mousePos = new Physics.vector();
            this.mousePosOld = new Physics.vector();
            this.offset = new Physics.vector();

            this.el = typeof this.options.el === 'string' ? document.getElementById(this.options.el) : this.options.el;

            if ( !this.el ){
                throw "No DOM element specified";
            }

            // init events
            var grab = function grab( e ){
                var pos = getCoords( e )
                    ,body
                    ;

                time = Physics.util.ticker.now();

                if ( self._world ){
                    body = self._world.findOne({ $at: new Physics.vector( pos.x, pos.y ), $in: self.getTargets() });



                    if ( body ){
                        // we're trying to grab a body

                        // fix the body in place
                        prevTreatment = body.treatment;
                        body.treatment = 'kinematic';
                        body.state.vel.zero();
                        body.state.angular.vel = 0;
                        // remember the currently grabbed body
                        self.body = body;
                        // remember the mouse offset
                        self.mousePos.clone( pos );
                        self.mousePosOld.clone( pos );
                        self.offset.clone( pos ).vsub( body.state.pos );

                        pos.body = body;
                        self._world.emit('interact:grab', pos);

                    } else {

                        self._world.emit('interact:poke', pos);
                    }
                }
            };

            var move = Physics.util.throttle(function move( e ){
                var pos = getCoords( e )
                    ,state
                    ;

                if ( self.body ){
                    time = Physics.util.ticker.now();

                    self.mousePosOld.clone( self.mousePos );
                    // get new mouse position
                    self.mousePos.set(pos.x, pos.y);

                    pos.body = self.body;
                }

                self._world.emit('interact:move', pos);

            }, self.options.moveThrottle);

            var release = function release( e ){
                var pos = getCoords( e )
                    ,body
                    ,dt = Math.max(Physics.util.ticker.now() - time, self.options.moveThrottle)
                    ;

                // get new mouse position
                self.mousePos.set(pos.x, pos.y);

                // release the body
                if (self.body){
                    self.body.treatment = prevTreatment;
                    // calculate the release velocity
                    self.body.state.vel.clone( self.mousePos ).vsub( self.mousePosOld ).mult( 1 / dt );
                    // make sure it's not too big
                    self.body.state.vel.clamp( self.options.minVel, self.options.maxVel );
                    self.body = false;
                }

                if ( self._world ){

                    self._world.emit('interact:release', pos);
                    self._world.emit('interact-spheres:release',pos);
                }
            };

            this.el.addEventListener('mousedown', grab);
            this.el.addEventListener('touchstart', grab);

            this.el.addEventListener('mousemove', move);
            this.el.addEventListener('touchmove', move);

            this.el.addEventListener('mouseup', release);
            this.el.addEventListener('touchend', release);
        },

        // extended
        connect: function( world ){

            // subscribe the .behave() method to the position integration step
            world.on('integrate:positions', this.behave, this);
        },

        // extended
        disconnect: function( world ){

            // unsubscribe when disconnected
            world.off('integrate:positions', this.behave);
        },

        // extended
        behave: function( data ){

            var self = this
                ,state
                ,dt = Math.max(data.dt, self.options.moveThrottle)
                ;

            if ( self.body ){

                // if we have a body, we need to move it the the new mouse position.
                // we'll do this by adjusting the velocity so it gets there at the next step
                state = self.body.state;
                state.vel.clone( self.mousePos ).vsub( self.offset ).vsub( state.pos ).mult( 1 / dt );
            }
        }
    };
});

Physics.behavior('interactive-ring', function( parent ){

    if ( !document ){
        // must be in node environment
        return {};
    }

    var defaults = {
            // the element to monitor
            el: null,
            // time between move events
            moveThrottle: 1000 / 100 | 0,
            // minimum velocity clamp
            minVel: { x: -5, y: -5 },
            // maximum velocity clamp
            maxVel: { x: 5, y: 5 }
        }
        ,getElementOffset = function( el ){
            var curleft = 0
                ,curtop = 0
                ;

            if (el.offsetParent) {
                do {
                    curleft += el.offsetLeft;
                    curtop += el.offsetTop;
                } while (el = el.offsetParent);
            }

            return { left: curleft, top: curtop };
        }
        ,getCoords = function( e ){
            var offset = getElementOffset( e.target )
                ,obj = ( e.changedTouches && e.changedTouches[0] ) || e
                ,x = obj.pageX - offset.left
                ,y = obj.pageY - offset.top
                ;

            return {
                x: x
                ,y: y
            };
        }
        ;

    return {
        // extended
        init: function( options ){

            var self = this
                ,prevTreatment
                ,time
                ;

            // call parent init method
            parent.init.call( this );
            this.options.defaults( defaults );
            this.options( options );

            // vars
            this.mousePos = new Physics.vector();
            this.mousePosOld = new Physics.vector();
            this.offset = new Physics.vector();

            this.el = typeof this.options.el === 'string' ? document.getElementById(this.options.el) : this.options.el;

            if ( !this.el ){
                throw "No DOM element specified";
            }

            // init events
            var grab = function grab( e ){
                var pos = getCoords( e )
                    ,body
                    ;

                time = Physics.util.ticker.now();

                if ( self._world ){
                    body = self._world.findOne({ $at: new Physics.vector( pos.x, pos.y ), $in: self.getTargets() });



                    if ( body ){
                        // we're trying to grab a body

                        // fix the body in place
                        prevTreatment = body.treatment;
                        body.treatment = 'kinematic';
                        body.state.vel.zero();
                        body.state.angular.vel = 0;
                        // remember the currently grabbed body
                        self.body = body;
                        // remember the mouse offset
                        self.mousePos.clone( pos );
                        self.mousePosOld.clone( pos );
                        self.offset.clone( pos ).vsub( body.state.pos );

                        pos.body = body;
                        self._world.emit('interact:grab', pos);

                    } else {

                        self._world.emit('interact:poke', pos);
                    }
                }
            };

            var move = Physics.util.throttle(function move( e ){
                var pos = getCoords( e )
                    ,state
                    ;

                if ( self.body ){
                    time = Physics.util.ticker.now();

                    self.mousePosOld.clone( self.mousePos );
                    // get new mouse position
                    self.mousePos.set(pos.x, pos.y);

                    pos.body = self.body;
                }

                self._world.emit('interact:move', pos);

            }, self.options.moveThrottle);

            var release = function release( e ){
                var pos = getCoords( e )
                    ,body
                    ,dt = Math.max(Physics.util.ticker.now() - time, self.options.moveThrottle)
                    ;

                // get new mouse position
                self.mousePos.set(pos.x, pos.y);

                // release the body
                if (self.body){
                    self.body.treatment = prevTreatment;
                    // calculate the release velocity
                    self.body.state.vel.clone( self.mousePos ).vsub( self.mousePosOld ).mult( 1 / dt );
                    // make sure it's not too big
                    self.body.state.vel.clamp( self.options.minVel, self.options.maxVel );
                    self.body = false;
                }

                if ( self._world ){

                    self._world.emit('interact:release', pos);
                    self._world.emit('interact-ring:release',pos);
                }
            };

            this.el.addEventListener('mousedown', grab);
            this.el.addEventListener('touchstart', grab);

            this.el.addEventListener('mousemove', move);
            this.el.addEventListener('touchmove', move);

            this.el.addEventListener('mouseup', release);
            this.el.addEventListener('touchend', release);
        },

        // extended
        connect: function( world ){

            // subscribe the .behave() method to the position integration step
            world.on('integrate:positions', this.behave, this);
        },

        // extended
        disconnect: function( world ){

            // unsubscribe when disconnected
            world.off('integrate:positions', this.behave);
        },

        // extended
        behave: function( data ){

            var self = this
                ,state
                ,dt = Math.max(data.dt, self.options.moveThrottle)
                ;

            if ( self.body ){

                // if we have a body, we need to move it the the new mouse position.
                // we'll do this by adjusting the velocity so it gets there at the next step
                state = self.body.state;
                state.vel.clone( self.mousePos ).vsub( self.offset ).vsub( state.pos ).mult( 1 / dt );
            }
        }
    };
});


$(document).ready(function(){
  var weights = [100,200,500,1000];
  var pointmasses = [250,250,250,250,56,500,1000]
  var spherenames = ['Hollow','Solid']
  weightlabels = $('.weightlabel')
  pointmasslabels = $('.pointmasslabel')
  spherelabels = $('.spherelabel')
  //move all labels into their correct spots
  for(var i=0;i<spherelabels.length;i++){
    $(spherelabels[i]).css({'top':$(window).height()*0.75 + 55,'left':$(window).width()*0.135+(i* $(window).width()*0.1)});
    $(spherelabels[i]).append(spherenames[i])
  }
  for(var i=0;i<weightlabels.length;i++){
    $(weightlabels[i]).css({'top':$(window).height()*0.55+10,'left':$(window).width()*0.77+(i*60)});
    $(weightlabels[i]).append(weights[i])
  }
  for(var i=0;i<pointmasses.length;i++){
    $(pointmasslabels[i]).css({'top':$(window).height()*0.55+10,'left':$(window).width()*0.172+(i*45)});
    $(pointmasslabels[i]).append(pointmasses[i]);
  }
  $('.totalweight').css({'top':$(window).height()*0.1,'left':$(window).width()*0.70});
  $('#ptmasstitle').css({'top':$(window).height()*0.47,'left':$(window).width()*0.21});
  $('#acceldiv').css({'top':$(window).height()*0.70,'left':$(window).width()*0.65,'font-size':25});
  $('#title').css({'margin-top':$(window).height()*0.05,'margin-left':$(window).width()*0.4});
  $('.ringlabel').css({'top':$(window).height()*0.75 + 75,'left':$(window).width()*0.385});
  $('.instructions').css({'top':$(window).height()*0.4,'left':$(window).width()*0.4,'font-size':25});
  setTimeout(function(){
    window.alert("Hello There!\nWelcome to this moment of inertia lab. Since it's still under development, you're gonna have to reset the simulation after each run. Sorry :(")
  },500);
});

var massonstring = 0;

//change weight displayed on label
var changeweight = function(num){
  var weights = [0,100,200,500,1000];
  if(num ==0 ){
    massonstring=0;
  }else{
    massonstring+=weights[num];
  }
  $('.totalweight').empty();
  $('.totalweight').append("Weight on String: "+ (massonstring).toString());
}

//calculate acceleration of hanging mass using mass and moment of inertia
var accelerationFormula = function(mass,moi){
  var acc = (mass*0.0625*9.81)/((mass*0.0625)+moi);
  return acc;
}

//apply parrallel axis theorom to find mom of I for objects
var parralleaxisthereom = function(distance,mass,initial){
  var moi = initial + mass*(distance*distance);
  return moi;
}

//calc the radius of an object from center
var calcradius = function(lockloc,height,width){
  var lockx = (lockloc.x - width*0.25)/150;
  var locky = (lockloc.y - height*0.25)/150;
  return lockx==0.0 ? locky*0.25 : lockx*0.25;
}

//update the acceleration label
var updateacc = function(acc){
  $('#acceldiv').empty();
  $('#acceldiv').append("Acceleration of hanging mass: "+ acc.toFixed(4).toString() + " m/s^2")
}

Physics(function(world) {

  renderer = Physics.renderer('canvas',{
    el:'viewport',
    width: 1250,
    height: 800,
  });

  world.add(renderer);

  var weightnums = [100,200,500,1000];
  var pointmassnums = [250,250,250,250,56,500,1000];
  var weightattached = [false,false,false,false];
  var weightlocs = [];
  var weights = [];
  var pointmasses = [];
  var locklocs = [];
  var lockpoints = [];
  var ringlocklocs = [];
  var ringattached = false;
  var pointmassattached = [false,false,false,false,false,false,false];
  var backuppointmassattached = [];
  var pointmasslocs = [];
  var spheres = [];
  var sphereattached = [false,false];
  var backupsphereattached = [];
  var spherelocs = [];
  var numweightattached = -1;

  var spheremois = [0.0009,0.0004];
  var spheremass = .5;

  var pointmassmoi = 0.0;
  var spheremoi = 0.0;
  var ringmoi = 0.0;
  var move = false;
  var numtimes = 1;

  var newline;

  //endpos of line
  var endpos = {
    x: renderer.width*0.75-125,
    y: renderer.height*0.25+70.5
  }

  var weightcolors = ['#FF0000','#00FF00','#FFFF00','#800080']
  var pointmasscolors = ['#FF0000','#FF0000','#FF0000','#FF0000','#00FF00','#000080','#9900CC']


  world.on('render',function(data){
    //make the line extend as the mass drops down
    numtimes = 1;
    if(move){
      numtimes+=1
      newline = Physics.body('rectangle', {
        x: renderer.width*0.75-125,
        y: renderer.height*0.25+41.5,
        height: 58,
        width: 3,
        style: {
          fillStyle: '#000'
        }
      })
      setTimeout(function(){
        world.add(newline);
      },400);
    }
  })

  //create all Physics bodies
  line = Physics.body('rectangle', {
    x: renderer.width*0.75-125,
    y: renderer.height*0.25+41.5,
    height: 58,
    width: 3,
    style: {
      fillStyle: '#000'
    },
  })

  //create side and top view of table
  topview = Physics.body('circle', {
       x: renderer.width * 0.25
       ,y: renderer.height * 0.25
       ,radius: 150
       ,styles: {
           fillStyle: '#6c71c4'
           ,angleIndicator: '#3b3e6b'
       }
  });

  sideview = Physics.body('rectangle',{
    x: renderer.width * 0.75
    ,y: renderer.height * 0.25
    ,width: 250
    ,height: 25
    ,treatment: "static"
    ,styles: {
      fillStyle: '#6c71c4'
    }
  });

  //create the sphere
  var hollowsphere = Physics.body('circle',{
    x: renderer.width * 0.15,
    y: renderer.height * 0.75,
    radius: 50,
    treatment: "static",
    name: 'sphere'
  });
  hollowsphere.view = new Image();
  hollowsphere.view.src = './images/hollowsphere.png'
  spheres.push(hollowsphere);
  spherelocs.push({x:renderer.width*0.15,y:renderer.height*0.75});

  var solidsphere = Physics.body('circle',{
    x: renderer.width * 0.25,
    y: renderer.height * 0.75,
    radius:50,
    treatment: "static",
    name: 'sphere'
  });
  solidsphere.view = new Image();
  solidsphere.view.src = './images/solidsphere.png'
  spheres.push(solidsphere)
  spherelocs.push({x:renderer.width*0.25,y:renderer.height*0.75});

  //create the ring
  ring = Physics.body('circle',{
    x: renderer.width*0.4,
    y: renderer.height* 0.75,
    radius: 50,
    treatment: "static",
    name: 'ring'
  });
  ring.view = new Image();
  ring.view.src = './images/ring.png'

  var rings = [ring]

  //create the weights
  for(var i = 1;i<5;i++){
    weights.push(Physics.body('rectangle',{
      x: renderer.width*0.75+(i*60),
      y: renderer.height*0.55,
      width: 50,
      height: 15,
      treatment: "static",
      styles: {
        fillStyle: weightcolors[i-1]
      },
      name: 'weight'
    }));
    weightlocs.push({x:renderer.width*0.75+(i*60),y:renderer.height*0.55});
  }

  //create the point masses
  for(var i=0;i<7;i++){
    pointmasses.push(Physics.body('circle',{
      x: renderer.width*0.18+(i*45),
      y: renderer.height*0.55,
      radius: 15,
      treatment: "static",
      styles: {
        fillStyle: pointmasscolors[i]
      },
      name: 'masses'
    }));
    pointmasslocs.push({x:renderer.width*0.18+(i*45),y:renderer.height*0.55});
  }

  //create the lock locations
  for(var i=1.0;i>-1.5;i-=0.5){
    if(i==0.0){
      continue;
    }
    lockpoints.push(Physics.body('circle',{
      x: renderer.width * 0.25,
      y: renderer.height * 0.25 + (i*150),
      radius: 10,
      treatment: "static",
      styles: {
        fillStyle: '#FFFF00'
      }
    }));
    locklocs.push({x:renderer.width*0.25,y:renderer.height * 0.25 + (i*150)});
  }

  for(var i=1.0;i>-1.5;i-=0.5){
    if(i==0.0){
      continue;
    }
    lockpoints.push(Physics.body('circle',{
      x: renderer.width * 0.25 + (i*150),
      y: renderer.height * 0.25,
      radius: 10,
      treatment: "static",
      styles: {
        fillStyle: '#FFFF00'
      }
    }));
    locklocs.push({x:renderer.width*0.25 + (i*150),y:renderer.height * 0.25});
  }

  lockpoints.push(Physics.body('circle', {
    x:renderer.width * 0.25,
    y: renderer.height *0.25,
    radius: 10,
    treatment: "static",
    styles: {
      fillStyle: '#FFFF00'
    }
  }));
  locklocs.push({x:renderer.width*0.25,y:renderer.height*0.25});

  //ring can only attach at 5 points
  for(var i=0;i<locklocs.length;i++){
    if(calcradius(locklocs[i],renderer.height,renderer.width)<=0.125){
      ringlocklocs.push(locklocs[i]);
    }
  }


  world.on('step',function(){
    world.render();
  });

  //called when a weight is dropped
  world.on('interact-weight:release',function(pos){
    goahead = false;
    //make sure a weight is being picked up
    for(var i=0;i<weights.length;i++){
      if(weights[i].state.pos.y<pos.y+25 && weights[i].state.pos.y>pos.y-25 && weights[i].state.pos.x<pos.x+8 && weights[i].state.pos.x>pos.x-8)
        goahead = true;
    }
    if(goahead){
      weightattached=[false,false,false,false]
      for(var i=0;i<4;i++){
        //checks if weight is close to end of line
        var first = false;
        var second = false;
        if(weights[i].state.pos.y<endpos.y+10 && weights[i].state.pos.y>endpos.y-10){
          first = true;
        }
        if(weights[i].state.pos.x<endpos.x+10 && weights[i].state.pos.x>endpos.x-10){
          second = true;
        }
        if(first && second && weightattached[i]==false){
          weightattached[i]=true;
          numweightattached = i;
          weights[i].state.pos.x = endpos.x;
          weights[i].state.pos.y = endpos.y;
          changeweight(i+1)
        }
      }
      //moves all unattached weights back to original location
      for(var i=0;i<4;i++){
        if(weightattached[i]==false){
          weights[i].state.pos.x=weightlocs[i].x;
          weights[i].state.pos.y=weightlocs[i].y;
        }
      }
      zeroed = true;
      for(var i=0;i<4;i++){
        zeroed = zeroed && !weightattached[i];
      }
      if(zeroed){
        changeweight(0)
        massonstring = 0;
      }
    }
  });

  //called when a point mass is release
  world.on('interact-masses:release',function(pos){
    goahead = false;
    //make sure a point mass is picked up
    for(var i=0;i<pointmasses.length;i++){
      if(pointmasses[i].state.pos.y<pos.y+15 && pointmasses[i].state.pos.y>pos.y-15 && pointmasses[i].state.pos.x<pos.x+15 && pointmasses[i].state.pos.x>pos.x-15)
        goahead = true;
    }
    if(goahead){
      pointmassmoi=0.0;
      for(var i=0;i<pointmasses.length;i++){
        if(pointmassattached[i]==false){
          pointmasses[i].offset.x = 0;
          pointmasses[i].offset.y = 0;
        }
      }
      for(var i=0;i<7;i++){
        for(var v=0;v<9;v++){
          var first = false;
          var second = false;
          if(pointmasses[i].state.pos.y<locklocs[v].y+10 && pointmasses[i].state.pos.y>locklocs[v].y-10){
            first = true;
          }
          if(pointmasses[i].state.pos.x<locklocs[v].x+10 && pointmasses[i].state.pos.x>locklocs[v].x-10){
            second = true;
          }
          if(first && second && pointmassattached[i]==false){
            pointmassattached[i]=true;
            //more point mass to center of circle
            pointmasses[i].state.pos.x = renderer.width*0.25;
            pointmasses[i].state.pos.y = renderer.height*0.25;
            //offset point mass to make it rotate around the center of circle
            pointmasses[i].offset.x = (renderer.width*0.25 - locklocs[v].x)*-1;
            pointmasses[i].offset.y = (renderer.height*0.25 - locklocs[v].y)*-1;
            rad = calcradius(locklocs[v],renderer.height,renderer.width);
            pointmassmoi+=pointmassnums[i]*(rad*rad)/1000.0;
            v = 10;
          }
        }
        //move unattached point masses back
        if(pointmassattached[i]==false){
          pointmasses[i].state.pos.x = pointmasslocs[i].x;
          pointmasses[i].state.pos.y = pointmasslocs[i].y;
        }
      }
      backuppointmassattached = pointmassattached
    }else{
      //if some other object is picked up
    }
  });

  //if sphere is released
  world.on('interact-spheres:release',function(pos){
    goahead = false;
    //check if its really the sphere
    for(var i=0;i<spheres.length;i++){
      if(spheres[i].state.pos.y<pos.y+25 && spheres[i].state.pos.y>pos.y-25 && spheres[i].state.pos.x>pos.x-25 && spheres[i].state.pos.x<pos.x+25)
        goahead = true;
    }
    if(goahead){
      spheremoi=0.0;
      for(var i=0;i<2;i++){
        if(sphereattached[i]==false){
          spheres[i].offset.x = 0;
          spheres[i].offset.y = 0;
        }
      }
      for(var i=0;i<2;i++){
        for(var v=0;v<9;v++){
          //check if its close enough to lock location
          var first = false;
          var second = false;
          if(spheres[i].state.pos.y<locklocs[v].y+25 && spheres[i].state.pos.y>locklocs[v].y-25){
            first = true;
          }
          if(spheres[i].state.pos.x<locklocs[v].x+25 && spheres[i].state.pos.x>locklocs[v].x-25){
            second = true;
          }
          if(first && second && sphereattached[i]==false){
            sphereattached[i]=true;
            spheres[i].state.pos.x = renderer.width*0.25;
            spheres[i].state.pos.y = renderer.height*0.25;
            spheres[i].offset.x = (renderer.width*0.25 - locklocs[v].x)*-1;
            spheres[i].offset.y = (renderer.height*0.25 - locklocs[v].y)*-1;
            rad = calcradius(locklocs[v],renderer.height,renderer.width);
            spheremoi+=parralleaxisthereom(rad,spheremass,spheremois[i]);
            v=10;
          }
          if(!first || !second){
            sphereattached[i]=false;
          }
        }
      }
      for(var i=0;i<2;i++){
        if(sphereattached[i]==false){
          spheres[i].state.pos.x=spherelocs[i].x;
          spheres[i].state.pos.y=spherelocs[i].y;
          spheres[i].offset.x = 0;
          spheres[i].offset.y = 0;
        }
      }
      backupsphereattached = sphereattached
    }else{
      //if other object is released
    }
  });

  //if ring is released
  world.on('interact-ring:release',function(pos){
    goahead = false;
    //check if its really the ring
    if(rings[0].state.pos.y<pos.y+20 && rings[0].state.pos.y>pos.y-20 && rings[0].state.pos.x<pos.x+20 && rings[0].state.pos.x>pos.x-20){
      goahead = true;
    }
    if(goahead){
      for(var v=0;v<ringlocklocs.length;v++){
        //check if ring is close enough to lock locations
        var first = false;
        var second = false;
        if(rings[0].state.pos.y<ringlocklocs[v].y+10 && rings[0].state.pos.y>ringlocklocs[v].y-10){
          first = true;
        }
        if(rings[0].state.pos.x<ringlocklocs[v].x+10 && rings[0].state.pos.x>ringlocklocs[v].x-10){
          second = true;
        }
        if(first && second && ringattached==false){
          ringattached=true;
          rings[0].state.pos.x = renderer.width*0.25;
          rings[0].state.pos.y = renderer.height*0.25;
          rings[0].offset.x = (renderer.width*0.25 - ringlocklocs[v].x)*-1;
          rings[0].offset.y = (renderer.height*0.25 - ringlocklocs[v].y)*-1;
          rad = calcradius(ringlocklocs[v],renderer.height,renderer.width);
          moicom = 0.5*(0.125*0.125);
          ringmoi += parralleaxisthereom(rad,0.5,moicom);
        }
      }
      if(ringattached==false){
        rings[0].state.pos.x = renderer.width*0.40;
        rings[0].state.pos.y = renderer.height*0.75;
        rings[0].offset.x = 0;
        rings[0].offset.y = 0;
      }
    }else{
      //if something else was released
    }
  })

  $(window).keypress(function(e) {
    if( e.keyCode==0 || e.keyCode==32){ //space bar
      world.emit('release',{});
    }else if( e.keyCode==82|| e.keyCode==114){ //'r'
      world.emit('reset',{});
    }
  });

  //reset everything
  world.on('reset',function(data, e){
    ringattached = false;
    for(var i=0;i<weights.length;i++){
      weights[i].state.pos.x = weightlocs[i].x;
      weights[i].state.pos.y = weightlocs[i].y;
    }
    for(var i=0;i<pointmasses.length;i++){
      pointmasses[i].treatment = "static"
      pointmasses[i].state.pos.x = pointmasslocs[i].x;
      pointmasses[i].state.pos.y = pointmasslocs[i].y;
      pointmasses[i].offset.x = 0;
      pointmasses[i].offset.y = 0;
      var newpointmass;
      if(pointmassattached[i]==true){  //create new point mass to replace recently released one because old has incorrect treatment
        newpointmass = Physics.body('circle',{
          x: pointmasslocs[i].x,
          y: pointmasslocs[i].y,
          radius: 15,
          treatment: "static",
          styles: {
            fillStyle: pointmasscolors[i]
          },
          name: "masses"
        })
        world.remove(pointmasses[i])
        world.add(newpointmass)
        pointmasses[i]=newpointmass
        world.add(Physics.behavior('interactive-masses', {
          el: renderer.el
        }).applyTo(pointmasses));
      }
    }
    for(var i=0;i<spheres.length;i++){
      spheres[i].treatment = "static"
      spheres[i].state.pos.x = spherelocs[i].x;
      spheres[i].state.pos.y = spherelocs[i].y;
      spheres[i].offset.x = 0;
      spheres[i].offset.y = 0;
    }
    rings[0].treatment = "static"
    rings[0].state.pos.x = renderer.width* 0.40;
    rings[0].state.pos.y = renderer.height* 0.75;
    rings[0].offset.x = 0;
    rings[0].offset.y = 0;
    newring = Physics.body('circle',{
      x: renderer.width*0.40,
      y: renderer.height*0.75,
      radius: 50,
      treatment: "static",
      name: "ring"
    })
    newring.view = new Image();
    newring.view.src = './images/ring.png'
    world.remove(rings[0])
    world.add(newring)
    rings[0] = newring;
    world.add(Physics.behavior('interactive-ring', {
      el: renderer.el
    }).applyTo(rings));
    massonstring = 0;
    changeweight(0)
    spheremoi = 0.0;
    pointmassmoi = 0.0;
    ringmoi = 0.0;
    topview.state.angular.pos = 0.0;
    spheres[0].state.angular.pos = 0.0;
    spheres[1].state.angular.pos = 0.0;
    line.state.pos.x= renderer.width*0.75-125;
    line.state.pos.y= renderer.height*0.25+41.5;
    weightattached=[false,false,false,false];
    sphereattached = [false,false];
    pointmassattached = [false,false,false,false,false,false,false];
    //console.log(line.height)
    world.remove(newline)
  });

  //when animation is started
  world.on('release',function(data,e){
    topview.sleep(false);
    line.sleep(false);
    move = true;
    weights[numweightattached].sleep(false);
    weights[numweightattached].treatment = "dynamic"
    var acc = accelerationFormula(massonstring/1000.0,spheremoi+pointmassmoi+0.03+ringmoi);
    topview.state.angular.vel = 0.001;
    weights[numweightattached].state.vel.set(0,0.01)
    line.state.vel.set(0,0.01)
    for(var i=0;i<backuppointmassattached.length;i++){
      if(backuppointmassattached[i]==true){
        pointmasses[i].treatment = "dynamic"
        pointmasses[i].sleep(false);
        pointmasses[i].state.angular.vel = 0.0005;
      }
    }
    for(var i=0;i<backupsphereattached.length;i++){
      if(backupsphereattached[i]==true){
        spheres[i].treatment = "dynamic"
        spheres[i].sleep(false);
        spheres[i].state.angular.vel = 0.0005;
      }
    }
    if(ringattached == true){
      ring.treatment = "dynamic";
      ring.sleep(false);
      ring.state.angular.vel = 0.0005;
    }
    setTimeout(function(){ //stop all animation after 3 secs
      for(var i=0;i<pointmasses.length;i++){
        pointmasses[i].treatment = "static"
        pointmasses[i].state.angular.vel = 0;
      }
      for(var i=0;i<spheres.length;i++){
        spheres[i].treatment = "static"
        spheres[i].state.angular.vel = 0;
      }
      ring.treatment = "static";
      ring.state.angular.vel = 0;
      topview.state.angular.vel = 0
      weights[numweightattached].state.vel.set(0,0);
      weights[numweightattached].treatment="static"
      line.state.vel.set(0,0);
      move = false;
      updateacc(acc)
    },3000)
  },1);

  //add all bodies to the world
  world.add([topview,sideview])
  world.add(line)
  world.add(lockpoints)
  world.add(weights)
  world.add([hollowsphere,solidsphere])
  world.add(pointmasses)
  world.add(rings)

  //add custom behaviors for each of the interactive objects
  world.add(Physics.behavior('interactive-weights', {
    el: renderer.el
  }).applyTo(weights));
  world.add(Physics.behavior('interactive-masses', {
    el: renderer.el
  }).applyTo(pointmasses));
  world.add(Physics.behavior('interactive-spheres', {
    el: renderer.el
  }).applyTo([hollowsphere,solidsphere]));
  world.add(Physics.behavior('interactive-ring', {
    el: renderer.el
  }).applyTo(rings));

  Physics.util.ticker.on(function( time ) {
        world.step( time );
  });

  Physics.util.ticker.start();

})
