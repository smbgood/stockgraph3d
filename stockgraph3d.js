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

var gridXY, gridYZ, gridXZ;

var projector, mouseVector;

var pSystem;

var Parameters;

var graphedLine;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

var dataAmount = 10;

var arcLength = 10;

var factor = 1000;	

var displayToggle = true;

var autoUpdate = true;

var gridlinesShowing = true;

var shownSprites = [];

var SCREEN_WIDTH, SCREEN_HEIGHT;

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

	window.addEventListener( 'mousemove', onMouseMove, false);
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

	gui = new dat.GUI();
	
	Parameters = function()
	{		
		this.stockName = "DIS";				
	};

	var params = new Parameters();

	var gui_stock_name = gui.add(params, 'stockName').name('Stock Name');
	var gui_mult_factor = gui.add(this, 'factor', 1, 5000).name('* factor');
	var gui_range_weeks = gui.add(this, 'dataAmount', 1, stockData.length).name('# of weeks');
	var gui_display_toggle = gui.add(this, 'displayToggle').name('Display Toggle');	
	autoUpdate = true;

	gui_range_weeks.onChange( function(value) { if(autoUpdate){ createGraph(); } } );
	gui_mult_factor.onChange( function(value) { if(autoUpdate){ createGraph(); } } );
	gui_display_toggle.onChange( function(value){ toggleGridlines(value);});

	gui_mult_factor.setValue(1000);
	gui_range_weeks.setValue(10);	

	/*for (var i = 0; i < geometry.vertices.length; i++)
	{
		var spritey = makeTextSprite( " " + i + " ", { fontsize: 32, backgroundColor: {r:255, g:100, b:100, a:1} } );
		spritey.position = geometry.vertices[i].clone().multiplyScalar(1.1);
		scene.add( spritey );
	}*/

	createGraph();
}

function onMouseMove( e ) {
		
		mouseVector.x = 2 * (e.clientX / SCREEN_WIDTH) - 1;
		mouseVector.y = 1 - 2 * ( e.clientY / SCREEN_HEIGHT );

		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouseVector, camera);
		var arrayToFind = [];
		arrayToFind.push(pSystem);
		var intersects = raycaster.intersectObjects( arrayToFind);

		for( var i = 0; i < intersects.length; i++ ) {
			var intersection = intersects[ i ],
				obj = intersection.object;

			obj.material.color.setRGB( 1.0 - i / intersects.length, 0, 0 );
		}

		console.log('moved!' + intersects.length);

}

function createGraph(){	
	var lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 10 } );	
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

	var particles = new THREE.Geometry(),
    pMaterial = new THREE.PointsMaterial({
      color: 0x2222FF,
      size: 5
    });
    particles.vertices = stockGraph.vertices;
    if(pSystem){
    	scene.remove(pSystem);
    }
    pSystem = new THREE.Points(particles, pMaterial);
    scene.add(pSystem);

	/*if(shownSprites.length > 0){
		for(i=0; i< shownSprites.length;i++){
			scene.remove(shownSprites[i]);
		}
		shownSprites = [];
	}

	for (i = 0; i < stockGraph.vertices.length; i++)
	{
		var spritey = makeTextSprite( " " + i + " ", { fontsize: 32, backgroundColor: {r:255, g:100, b:100, a:1} } );
		spritey.position = stockGraph.vertices[i].clone().multiplyScalar(1.1);
		scene.add( spritey );
		shownSprites.push(spritey);
	}*/
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



