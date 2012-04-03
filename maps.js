function initialize() {
    // refered http://blog.bn.ee/2012/03/31/how-to-use-google-maps-8-bit-tiles-in-your-own-project/
    var _8bitTile = {
	getTileUrl: function(coord, zoom) {
	    return "http://mt1.google.com/vt/lyrs=8bit,m@174000000&hl=en&src=app&s=Galil&" +
		"z=" + zoom + "&x=" + coord.x + "&y=" + coord.y;
	},
	tileSize: new google.maps.Size(256, 256),
	isPng: true	
    };
    var _8bitMapType = new google.maps.ImageMapType(_8bitTile);
    var myLatlng = new google.maps.LatLng(37.055177, 136.362305);
    var myOptions = {
	zoom: 5,
	center: myLatlng,
	mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    map.overlayMapTypes.insertAt(0, _8bitMapType);
}
