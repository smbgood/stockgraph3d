//3d stock grapher js

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, gui;

var gridXY, gridYZ, gridXZ;

var projector, mouseVector;

//magic values to get sprites better aligned with points
var xAdjust = 19;
var yAdjust = -7;

var Parameters;

var graphedLine;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var dataAmount = 10;

var factor = 1000;	

var autoUpdate = true, gridlinesShowing = true, displayToggle = true;

var SCREEN_WIDTH, SCREEN_HEIGHT;

var selectedPoints = [], graphedLines = [], shownSprites = [], particles = [], shownSprites = [];

var selectedPointCount;

var weekStart = 0;


init();
animate();

// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,150,400);
	camera.lookAt(scene.position);	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( '3JS' );	
	container.appendChild( renderer.domElement );
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
	// CONTROLS
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(100,250,100);
	scene.add(light);
	
	mouseVector = new THREE.Vector3();	
	window.addEventListener( 'mousedown', onMouseDown, false);

	/*
	// FLOOR
	var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; 
	floorTexture.repeat.set( 10, 10 );
	var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);
	*/
	// SKYBOX
	/*var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);*/

	gridXZ = new THREE.GridHelper(100, 10);
	gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
	gridXZ.position.set( 0,0,0 );
	scene.add(gridXZ);
	
	gridXY = new THREE.GridHelper(100, 10);
	gridXY.position.set( 0,0,0 );
	gridXY.rotation.x = Math.PI/2;
	gridXY.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
	scene.add(gridXY);

	gridYZ = new THREE.GridHelper(100, 10);
	gridYZ.position.set( 0,0,0 );
	gridYZ.rotation.z = Math.PI/2;
	gridYZ.setColors( new THREE.Color(0x660000), new THREE.Color(0x660000) );
	scene.add(gridYZ);

	var sphere = new THREE.SphereGeometry( 100, 4, 3 );
	sphere.mergeVertices();	
	var sphereMaterial = new THREE.MeshNormalMaterial();
	var sphereMesh = new THREE.Mesh( sphere, sphereMaterial );
	sphereMesh.position.set(0,0,0);
	hexCubeMesh = new THREE.EdgesHelper(sphereMesh, 0x00ff00, 0.1);	
	scene.add(hexCubeMesh);

	selectedPointCount = 0;

	gui = new dat.GUI();
	
	Parameters = function()
	{		
		this.stockName = "DIS";
		this.drawSplines = function(){ drawSplines(); };				
	};

	var params = new Parameters();

	var gui_stock_name = gui.add(params, 'stockName').name('Stock Name');
	var gui_mult_factor = gui.add(this, 'factor', 1, 5000).name('* factor');
	var gui_week_start = gui.add(this, 'weekStart', 0, stockData.length).name('start');
	var gui_range_weeks = gui.add(this, 'dataAmount', 1, stockData.length - 1).name('# of weeks');
	var gui_display_toggle = gui.add(this, 'displayToggle').name('Display Grid');	
	var gui_draw_splines = gui.add(this, 'drawSplines').name('Draw Splines');
	var gui_hide_splines = gui.add(this, 'hideSplines').name('Hide Splines');
	var gui_select_points = gui.add(this, 'resetSelectedPoints').name('Reset Points Selected');

	/*var gui_x_adjust = gui.add(this, 'xAdjust', 1, 100).name('x adjust');
	var gui_y_adjust = gui.add(this, 'yAdjust', -100, 100).name('y adjust');*/

	autoUpdate = true;

	gui_range_weeks.onChange( function(value) { if(autoUpdate){ createGraph(); } } );
	gui_mult_factor.onChange( function(value) { if(autoUpdate){ createGraph(); } } );
	gui_week_start.onChange( function(value){ if(autoUpdate){ createGraph(); }});
	gui_display_toggle.onChange( function(value){ toggleGridlines(value);});
	gui_hide_splines.onChange(function (value){ hideSplines();});
	gui_select_points.onChange(function (value){ resetSelectedPoints(); });

	gui_mult_factor.setValue(1000);
	gui_range_weeks.setValue(10);	
	gui_week_start.setValue(0);
	gui_display_toggle.setValue(true);

	/*for (var i = 0; i < geometry.vertices.length; i++)
	{
		var spritey = makeTextSprite( " " + i + " ", { fontsize: 32, backgroundColor: {r:255, g:100, b:100, a:1} } );
		spritey.position = geometry.vertices[i].clone().multiplyScalar(1.1);
		scene.add( spritey );
	}*/

	createGraph();
}

function drawSplines(){
	if(selectedPoints.length > 0){		
		var vectorArray = [];
		for(var o = 0; o<selectedPoints.length;o++){
			vectorArray.push(selectedPoints[o].geometry.vertices[0]);
		}
		var ourCurve = new THREE.CatmullRomCurve3( vectorArray);

		var extrudeSettings = { steps: 200, bevelEnabled: false, extrudePath: ourCurve};

		var pts = [], numPts = 5;

		for ( var i = 0; i < numPts * 2; i ++ ) {

			var l = i % 2 == 1 ? 1 : 2;

			var a = i / numPts * Math.PI;

			pts.push( new THREE.Vector2 ( Math.cos( a ) * l, Math.sin( a ) * l ) );

		}

		var ourShape = new THREE.Shape( pts );
		var finalGeometry = new THREE.ExtrudeGeometry( ourShape, extrudeSettings );

		var material2 = new THREE.MeshLambertMaterial( { color: 0xff0000, wireframe: false } );

		var ourMesh = new THREE.Mesh( finalGeometry, material2 );

		scene.add( ourMesh );		
		graphedLines.push(ourMesh);
	}
}

function onMouseDown(e){

	mouseVector.x = 2 * (e.clientX / SCREEN_WIDTH) - 1;
	mouseVector.y = 1 - 2 * ( e.clientY / SCREEN_HEIGHT );

	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouseVector, camera);
	var intersects = raycaster.intersectObjects(particles);

	var selectedPoint;
	var deSelectedPoint;

	for( var i = 0; i < intersects.length; i++ ) {
		var intersection = intersects[ i ],
			obj = intersection.object;
		var arraySearch = $.inArray(obj, selectedPoints);
		if(arraySearch == -1){
			selectedPoint = obj;
			selectedPoints.push(obj);
			obj.material.color.setRGB( 1.0 - i / intersects.length, 0, 0 );
		}else{
			deSelectedPoint = obj;								
			selectedPoints = $.grep(selectedPoints, function(value){
				return value != obj;
			});
			obj.material.color.setRGB(0.1, 0.1, 1);
		}					
	}

	if(selectedPoint){		
		selectedPointCount++;
		var spritey = makeTextSprite( " " + selectedPointCount + " ", { fontsize: 24, backgroundColor: {r:255, g:100, b:100, a:1} } );		
		spritey.position.set(selectedPoint.geometry.vertices[0].x + xAdjust, selectedPoint.geometry.vertices[0].y + yAdjust, selectedPoint.geometry.vertices[0].z);
		scene.add( spritey );
		shownSprites.push(spritey);
			
	}else if(deSelectedPoint){
		hideSprites();
		selectedPointCount = 0;
		for(var o = 0; o<selectedPoints.length;o++){
			selectedPointCount++;
			var spritey = makeTextSprite( " " + selectedPointCount + " ", { fontsize: 24, backgroundColor: {r:255, g:100, b:100, a:1} } );		
			spritey.position.set(selectedPoints[o].geometry.vertices[0].x + xAdjust, selectedPoints[o].geometry.vertices[0].y + yAdjust, selectedPoints[o].geometry.vertices[0].z);
			scene.add( spritey );
			shownSprites.push(spritey);
		}
	}

	deSelectedPoint = null;
	selectedPoint = null;	
}

function createGraph(){	
	var lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 10 } );	
	var stockGraph = new THREE.Geometry();	
	for(var i =weekStart; i<dataAmount; i++){
		var weekData = stockData[i];		
		var p = parseFloat(weekData.price) * factor;
		var r = parseFloat(weekData.range) * factor;
		var v = parseFloat(weekData.volume) * (factor/2);
		stockGraph.vertices.push(new THREE.Vector3(p, r, v));
		console.log("P:" + p + "  R:" + r + "  V:" + v );
	}
	if(graphedLine){
		scene.remove(graphedLine);		
	}
	graphedLine = new THREE.Line(stockGraph, lineMaterial);
	scene.add(graphedLine);

	if(particles.length > 0){
		for(var j=0;j<particles.length;j++){
    		scene.remove(particles[j]);
    	}
    	particles = [];
    }    	

    for(i = 0; i<stockGraph.vertices.length; i++){
    	var geo = new THREE.Geometry();
    	geo.vertices.push(stockGraph.vertices[i]);
    	var pMaterial = new THREE.PointsMaterial({
      		color: 0x2222FF,
      		size: 5
    	});
		var particle = new THREE.Points(geo, pMaterial);
		particles.push(particle);		
		scene.add(particle);
    }
    selectedPoints = [];    
}

function hideSprites(){
	for(var s = 0; s<shownSprites.length;s++){
			var spriteo = shownSprites[s];
			scene.remove(spriteo);			
	}		
	shownSprites = [];		
}

function resetSelectedPoints(){
	for(var j=0; j<selectedPoints.length;j++){
		selectedPoints[j].material.color.setRGB(0.1, 0.1, 1);
	}
	selectedPoints = [];
	hideSprites();
}

function hideSplines(){
	for(var i = 0; i<graphedLines.length; i++){
		scene.remove(graphedLines[i]);
	}
}

function toggleGridlines( value){
	if(value){
		if(gridlinesShowing){
			return;
		}else{
			scene.add(gridXY);
			scene.add(gridYZ);
			scene.add(gridXZ);
			scene.add(hexCubeMesh);
			gridlinesShowing = true;
		}
	}else{
		if(!gridlinesShowing){
			return;
		}else{
			scene.remove(gridXZ);
			scene.remove(gridYZ);
			scene.remove(gridXY);
			scene.remove(hexCubeMesh);
			gridlinesShowing = false;
		}
	}
}

function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}

function update()
{
	if ( keyboard.pressed("z") ) 
	{	// do something   
	}
	
	controls.update();	
}

function render() 
{
	renderer.render( scene, camera );
}

//this and below method from 
/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
 */

function makeTextSprite( message, parameters )
{
	if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 18;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 4;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	//var spriteAlignment = parameters.hasOwnProperty("alignment") ?
	//	parameters["alignment"] : THREE.SpriteAlignment.topLeft;

	//var spriteAlignment = THREE.SpriteAlignment.topLeft;
		

	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;
	
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(0, 0, 0, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas) 
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture, color: 0x0000dd} );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(50,25,1.0);
	return sprite;	
}

// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r) 
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}



