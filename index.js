const ctx = document.getElementById("rendable").getContext("2d");
const fpsDiv = document.getElementById("fps");
var currentScale = 10;
var isRendering = false;

ctx.canvas.addEventListener('contextmenu', event => {
	event.preventDefault();
});

ctx.canvas.addEventListener('mousedown', e => {
	if(e.which === 3) {
		startPosition = new Position(e.clientX, e.clientY);
		prevCenter = new Position(center.x, center.y);
		ctx.canvas.addEventListener('mousemove', move);
	}
});
ctx.canvas.addEventListener('mouseup', e => {
	if(e.which === 3) {
		startPosition = new Position(0, 0);
		ctx.canvas.removeEventListener('mousemove', move);
	}
});

function move(e) {
	center.x = Math.floor(prevCenter.x + (e.clientX - startPosition.x) / currentScale);
	center.y = Math.floor(prevCenter.y + (e.clientY - startPosition.y) / currentScale);
	//startPosition.x = center.x;
	//startPosition.y = center.y;
}

const objects = [];

class Position {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

var prevCenter = new Position(0, 0);
var center = new Position(0, 0);
var startPosition = new Position(0, 0);

class Angles {
	constructor(...args) {
		this.points = args;
	}
}

const triangle = new Angles(
	new Position(0, 0),
	new Position(5, 5),
	new Position(5, -5),
);
const square = new Angles(
	new Position(0, 0),
	new Position(0, 50),
	new Position(50, 50),
	new Position(50, 0),
)

class Object {
	constructor(position, angles, color) {
		this.position = position;
		this.angles = angles;
		this.color = color;
	}
}

function drawRandom() {
	draw(new Position(Math.random()* 900, Math.random()*900), triangle, 10)
}

setInterval(async () => change(2000), 1000)

function change(n) {
	[...Array(n)].map(()=>{return Math.floor(Math.random()*objects.length)}).forEach(randIndex => objects[randIndex].color = getRandomColorRGB());
}

generateObjects(1, 1500000, 1);

function drawAll() {
	clearCanvas();
	objects.forEach(draw);
}

function zoom(e) {
	var delta = -e.deltaY/100;
	//ctx.scale(currentScale + delta, currentScale + delta);
	//currentScale = delta > 0 ? currentScale * 1.1 : currentScale / 1.1;
	currentScale += delta;
	if (currentScale <= 0) currentScale = 1;
	console.log(currentScale)
}

function download(){
	var link = document.createElement('a');
	link.download = 'filename.png';
	link.href = document.getElementById('rendable').toDataURL()
	link.click();
  }

function getRandomColor() {
	return "#" + Math.floor(Math.random()*16777215).toString(16);
}
function getRandomColorRGB() {
	return [Math.random()*255%255, Math.random()*255%255, Math.random()*255%255];
}

ctx.canvas.addEventListener("wheel", zoom)

function generateObjects(object, count, space) {
	const sqrt = Math.sqrt(count);
	for(let x = 0; x < sqrt; x++) {
		for(let y = 0; y < sqrt; y++) {
			objects.push(new Object(
				new Position(x * space, y * space),
				object,
				getRandomColorRGB()
			));
		}
	}
	console.log("Generated");
}

function clearCanvas() {
	ctx.save();
	ctx.globalCompositeOperation = 'copy';
	ctx.strokeStyle = 'transparent';
	ctx.beginPath();
	ctx.lineTo(0, 0);
	ctx.stroke();
	ctx.restore();
}

function drawT2() {
	return new Promise((resolve) => {
		clearCanvas();
		let imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
		let data = imageData.data;
		
		for (let i = 0; i < objects.length; i++){
			var o = objects[i];
			var position = new Position(o.position.x + center.x, o.position.y + center.y);
			if (position.x*currentScale > ctx.canvas.width || 
				position.y*currentScale > ctx.canvas.height ||
				position.x+o.angles < 0 ||
				position.y+o.angles < 0) {continue;}
			
			for (let y = 0; y < o.angles*currentScale; y++) {
				for (let x = 0; x < o.angles*currentScale; x++) {
					if (position.x*currentScale + x > ctx.canvas.width ||
						position.x*currentScale + x - 1 < 0) {continue;}

					const point = Math.floor((position.x*currentScale + position.y*imageData.width*currentScale + x + y*imageData.width - 1) * 4);
					
					data[point + 0] = o.color[0];
					data[point + 1] = o.color[1];
					data[point + 2] = o.color[2];
					data[point + 3] = 255;
				}
			}
		};

		//console.log("End 2", imageData, [...imageData.data]);
		ctx.putImageData(imageData, 0, 0);
		resolve();
	});
}

function draw(object) {
	ctx.beginPath();
	ctx.fillStyle = object.color;
	ctx.moveTo(object.position.x + object.angles.points[0].x, object.position.y + object.angles.points[0].y);
	for(let i = 1; i < object.angles.points.length; i++) {
		ctx.lineTo(object.position.x + object.angles.points[i].x, object.position.y + object.angles.points[i].y);
	}
	ctx.fill();
	ctx.fillStyle = "black";
}
  
function resizeCanvasToDisplaySize(canvas) {
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
  
	if (canvas.width !== width || canvas.height !== height) {
	   canvas.width = width;
	   canvas.height = height;
	   return true;
	}
  
	return false;
}

resizeCanvasToDisplaySize(ctx.canvas);
window.addEventListener("resize", () => resizeCanvasToDisplaySize(ctx.canvas));

setInterval(() => {
	if (isRendering) return;
	isRendering = true;
	var start = performance.now();
	drawT2().finally(() => {
		isRendering = false;
		fpsDiv.textContent = (1000/(performance.now() - start)).toFixed();
	});
}, 1);

function render(fn) {
	return new Promise((resolve) => {
		setTimeout(drawT2().finally(() => {
			fn(fn);
			console.log("render");
			resolve();
		}), 100);
	});
}

//setTimeout(() => render(render), 0);