var debug = (location.hash == "#debug");

function initialize() {
    var x = 258, y = 170;
    var map = new Map();
    var mainCharacter = new MainCharacter(map, x, y);
    var controller = new Controller(mainCharacter);
}

/**** Map ****/
function Map() {
    this.init();
}
Map.prototype = {
    map: null,

    init: function() {
	// refered http://blog.bn.ee/2012/03/31/how-to-use-google-maps-8-bit-tiles-in-your-own-project/
	var _8bitTile = {
	    getTileUrl: function(coord, zoom) {
		var t = Math.pow(2, zoom);
		return "http://mt1.google.com/vt/lyrs=8bit,m@174000000&hl=en&src=app&s=Galil&" +
		    "z=" + zoom + "&x=" + ((coord.x + t) % t) + "&y=" + ((coord.y + t) % t);
	    },
	    tileSize: new google.maps.Size(256, 256),
	    isPng: true	
	};
	var _8bitMapType = new google.maps.ImageMapType(_8bitTile);
	var myLatlng = new google.maps.LatLng(50.958426723359935, 1.7578125);
	var myOptions = {
	    zoom: 5,
	    center: myLatlng,
	    disableDefaultUI: true,
	    draggable: false,
	    keyboardShortcuts: false,
	    mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	this.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	this.map.overlayMapTypes.insertAt(0, _8bitMapType);
    },

    go: function(diff_x, diff_y) {
	this.map.panBy(diff_x * 16, diff_y * 16);
    },

    // coordinate to Point and LatLng
    getPositionInfo: function(x, y) {
	var proj = this.map.getProjection();
	if (this.map.getZoom() != 5) { alert('not implemented'); return; }
	var p = new google.maps.Point(x * 0.5, (y + 1) * 0.5);
	var latlng = proj.fromPointToLatLng(p);
	return {
	    game: [x, y],
	    point: p,
	    latlng: latlng
	};
    },

    // add marker to specified point (view coordinate)
    addMarker: function(x, y) {
	var pos = this.getPositionInfo(x, y);
	marker = new google.maps.Marker({
	    position: pos.latlng,
	    map: this.map,
	    animation: google.maps.Animation.DROP,
	    flat: true
	});
    }
};

/**** Controller ****/
function Controller(mainCharacter){
    this.mainCharacter = mainCharacter;
    this.init();
}
Controller.prototype = {
    INTERVAL: debug ? 150 : 250,
    pressing: false,
    prev_move_time: 0,
    update_flag: false,
    timer: undefined,

    init: function() {
	var self = this;
	$(document).
	    keydown(function(e){return self.keyHandler(e, true);}).
	    keyup(function(e){return self.keyHandler(e, false);});
	$("#game_control button").
	    mousedown(function(e){self.clickHandler(e, true)});
	this.resetTimer();
	this.draw();
    },

    updateIfTimeout: function() {
	if(new Date().getTime() - this.prev_move_time > this.INTERVAL){
	    this.update();
	}
    },

    resetTimer: function() {
	if (this.timer != undefined) { clearTimeout(this.timer); }
	var self = this;
	this.timer = setTimeout(function(){self.update()}, this.INTERVAL);
    },

    update: function() {
	this.resetTimer();

	if (this.pressing) {
	    this.mainCharacter.go(this.direction);
	    this.prev_move_time = new Date().getTime();
	}
	this.draw();
    },

    draw: function() {
	this.mainCharacter.draw();
    },

    keyHandler: function(e, flag){
	// check keycode
	var keyCode = e.keyCode ? e.keyCode : e.which;
	if (keyCode < 37 || keyCode > 40 || e.ctrlKey || e.shiftKey || e.altKey) {
	    this.pressing = false;
	    return true;
	}

	// update state
	this.direction = (keyCode - 38 + 4) % 4;
	this.pressing = flag;
	this.updateIfTimeout();

	return false;
    },

    clickHandler: function(e, down){
	switch (e.target.value){
	case "u": this.direction = 0; break;
	case "l": this.direction = 3; break;
	case "r": this.direction = 1; break;
	case "d": this.direction = 2; break;
	}
	this.pressing = down;
	this.updateIfTimeout();

	// event for mouseup
	if (down) {
	    var self = this;
	    $(document).mouseup(function(e){self.clickHandler(e, false);});
	} else {
	    $(document).unbind("mouseup");
	}
    }
};

/**** MainCharacter ****/
function MainCharacter(map, x, y){
    this.map = map;
    this.x = x;
    this.y = y;
    this.draw_direction = 2;
    this.checkPoint = new CheckPoint(map);
    this.init();
}
MainCharacter.prototype = {
    init: function() {
	this.checkPoint.draw();
	this.draw();

	if (debug) {
	    this.debugElm = $("<pre>").appendTo(document.body);
	}
    },

    // direction: 0=up, 1=left, 2=down, 3=right
    go: function(direction){
	this.draw_direction = direction;

	var diff_x = (direction % 2 == 1 ? -(direction - 2) : 0);
	var diff_y = (direction % 2 == 0 ?  (direction - 1) : 0);
	var new_x = (diff_x + this.x + 512) % 512;
	var new_y = (diff_y + this.y + 512) % 512;

	var c = map_data.charAt(new_x + new_y * 512);
	if (c == '1' || c == '2'){
	    new_x = this.x;
	    new_y = this.y;
	    diff_x = diff_y = 0;
	    this.draw(); // for change direction
	    return false;
	}

	this.map.go(diff_x, diff_y);
	this.draw_direction = direction;
	this.x = new_x;
	this.y = new_y;
	this.draw();

	// update check point
	if (c == '3') {
	    if (this.checkPoint.update(this.x, this.y)) {
		var p = this.checkPoint.getNormalizedPosition(this.x, this.y);
		//this.map.addMarker(p[0] - this.x + 1.5, p[1] - this.y + 0.5);
		this.map.addMarker(p[0] + 2.5, p[1] + 1);
	    }
	}

	this.outputDebugInfo();
    },

    draw: function() {
	this.update_flag = !this.update_flag;
	var index = this.draw_direction * 2 + (this.update_flag ? 1 : 0);
	$("#character img").css("top", (-index * 16) + "px");
    },

    outputDebugInfo: function() {
	if (debug) {
	    var p = this.map.getPositionInfo(this.x, this.y);
	    this.debugElm.text(
		"map: (" + this.x + "," + this.y +")\n" +
		    "image: (" + Math.floor(this.y / 16) + "," + Math.floor(this.x / 16) + ")\n" + 
		    "latlng: (" + p.latlng.lat() + "," + p.latlng.lng() + ")\n");
	}
    }
}


/**** CheckPoint ****/
function CheckPoint(map) {
    this.map = map;
    this.visited = 0;
    this.total = 152;
    this.points = {};
}
CheckPoint.prototype = {
    getNormalizedPosition: function(x, y) {
	var c1 = map_data.charAt(x + y * 512);
	var c2 = map_data.charAt(x - 1 + y * 512);
	if (c1 != '3') return null;
	if (c2 == '3') return [x - 1, y];
	return [x, y];
    },
    
    update: function(x, y) {
	// check visited
	var p = this.getNormalizedPosition(x, y);
	if (!p) return false;
	
	var key = p[0] + "," + p[1];
	if (key in this.points) return false;

	// first visit!!!
	this.points[key] = this.visited;
	this.visited++;

	this.draw();
	return true;
    },

    draw: function() {
	$("#check_points").text(this.visited + "/" + this.total);
    }
};
