//3d stock grapher js

//uses code from
/*
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
 */

// MAIN

// standard global variables
var container, scene, camera, renderer, controls, gui;

var Parameters;

var graphedLine;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var dataAmount = 10;

var displayToggle = true;

var autoUpdate = true;

// custom global variables
var mesh;

init();
animate();

// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
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

	var gridXZ = new THREE.GridHelper(100, 10);
	gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
	gridXZ.position.set( 0,0,0 );
	scene.add(gridXZ);
	
	var gridXY = new THREE.GridHelper(100, 10);
	gridXY.position.set( 0,0,0 );
	gridXY.rotation.x = Math.PI/2;
	gridXY.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
	scene.add(gridXY);

	var gridYZ = new THREE.GridHelper(100, 10);
	gridYZ.position.set( 0,0,0 );
	gridYZ.rotation.z = Math.PI/2;
	gridYZ.setColors( new THREE.Color(0x660000), new THREE.Color(0x660000) );
	scene.add(gridYZ);

	var geometry = new THREE.SphereGeometry( 100, 4, 3 );
	geometry.mergeVertices();	
	var material = new THREE.MeshNormalMaterial();
	mesh = new THREE.Mesh( geometry, material );
	mesh.position.set(0,0,0);
	var otherMesh = new THREE.EdgesHelper(mesh, 0x00ff00, 0.1);	
	scene.add(otherMesh);
	//scene.add(mesh);

	/*var axes = new THREE.AxisHelper(200);
	axes.position = mesh.position;
	scene.add(axes);*/


	var factor = 1000;	
	var lineMaterial = new THREE.LineBasicMaterial({color: 0x0000aa, linewidth: 10, transparent: true});
	var stockGraph = new THREE.Geometry();	
	for(var i =0; i<dataAmount; i++){
		var weekData = stockData[i];		
		var p = parseFloat(weekData.price) * factor;
		var r = parseFloat(weekData.range) * factor;
		var v = parseFloat(weekData.volume) * (factor/2);
		stockGraph.vertices.push(new THREE.Vector3(p, r, v));
		console.log("P:" + p + "  R:" + r + "  V:" + v );
	}
	graphedLine = new THREE.Line(stockGraph, lineMaterial);
	scene.add(graphedLine);

	gui = new dat.GUI();
	
	Parameters = function()
	{		
		this.finalValue = function(){ console.log('its the final value');};				
	};

	var params = new Parameters();

	gui.add(params, 'finalValue').name('Stock Name');
	var gui_range_weeks = gui.add(this, 'dataAmount', 10, 100).name('# of weeks');
	var gui_display_toggle = gui.add(this, 'displayToggle').name('Display Toggle');	
	autoUpdate = true;

	gui_range_weeks.onChange( function(value) { console.log('something happuned'); if(autoUpdate){ createGraph(); } } );

	/*for (var i = 0; i < geometry.vertices.length; i++)
	{
		var spritey = makeTextSprite( " " + i + " ", { fontsize: 32, backgroundColor: {r:255, g:100, b:100, a:1} } );
		spritey.position = geometry.vertices[i].clone().multiplyScalar(1.1);
		scene.add( spritey );
	}*/
}

function createGraph(){
	var factor = 1000;	
	var lineMaterial = new THREE.LineBasicMaterial({color: 0x0000aa, linewidth: 10, transparent: true});
	var stockGraph = new THREE.Geometry();	
	for(var i =0; i<dataAmount; i++){
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
}

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
	sprite.scale.set(100,50,1.0);
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



