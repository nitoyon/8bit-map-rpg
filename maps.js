function initialize() {
    var map = null;
    function initMap(){
	// refered http://blog.bn.ee/2012/03/31/how-to-use-google-maps-8-bit-tiles-in-your-own-project/
	var _8bitTile = {
	    getTileUrl: function(coord, zoom) {
		return "http://mt1.google.com/vt/lyrs=8bit,m@174000000&hl=en&src=app&s=Galil&" +
		    "z=" + zoom + "&x=" + ((coord.x + 32) % 32) + "&y=" + ((coord.y + 32) % 32);
	    },
	    tileSize: new google.maps.Size(256, 256),
	    isPng: true	
	};
	var _8bitMapType = new google.maps.ImageMapType(_8bitTile);
	var myLatlng = new google.maps.LatLng(51.094213,2.18938);
	var myOptions = {
	    zoom: 5,
	    center: myLatlng,
	    disableDefaultUI: true,
	    draggable: false,
	    keyboardShortcuts: false,
	    mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	map.overlayMapTypes.insertAt(0, _8bitMapType);
    }

    function initMainCharacter(){
	var INTERVAL = 300;
	var direction = 2;
	var pressing = false;
	var x = 258, y = 171;

	function keyHandler(evt, flag){
	    evt = evt ? evt : window.event;
	    var elm = evt.target || evt.srcElement;
	    var keyCode = evt.keyCode ? evt.keyCode : evt.which;

	    if (keyCode < 37 || keyCode > 40 || evt.ctrlKey || evt.shiftKey || evt.altKey) {
		pressing = false;
		return true;
	    }

	    var old_direction = direction;
	    var old_pressing = pressing;
	    var new_direction = (keyCode - 38 + 4) % 4;
	    var new_pressing = flag;
	    
	    if((new Date()).getTime() - prev_move_time > INTERVAL){
		direction = new_direction;
		pressing = flag;
		update(); // update now
		return false;
	    }
	    
	    direction = new_direction;
	    pressing = flag;
	    return false;
	}

	var draw_direction = direction;
	var prev_move_time = null;
	var update_flag = false;
	var timer = 0;
	function update(){
	    clearTimeout(timer);
	    
	    update_flag = !update_flag;
	    if(pressing){
		var diff_x = (direction % 2 == 1 ?  -(direction - 2) : 0);
		var diff_y = (direction % 2 == 0 ?  (direction - 1) : 0);
		var new_x = diff_x + x;
		var new_y = diff_y + y;

		console.log(new_x, new_y, map_data.substr(new_x - 10 + new_y * 512, 20));
		if (map_data.charAt(new_x + new_y * 512) != '0'){
		    new_x = x;
		    new_y = y;
		    diff_x = diff_y = 0;
		}

		map.panBy(diff_x * 16, diff_y * 16);
		prev_move_time = (new Date()).getTime();
		draw_direction = direction;
		x = new_x;
		y = new_y;
	    }

	    var index = draw_direction * 2 + (update_flag ? 1 : 0);
	    document.getElementById("character").childNodes[0].style.top = (-index * 16) + "px";
	    timer = setTimeout(update, INTERVAL);
	}

	document.onkeydown = function(e){return keyHandler(e, true);};
	document.onkeyup = function(e){return keyHandler(e, false);};
	update();
    }

    initMap();
    initMainCharacter();
}

