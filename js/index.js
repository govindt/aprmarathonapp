$(document).ready(function() {
	document.addEventListener('deviceready', onDeviceReady,false);
	
});

function onDeviceReady() {
	console.log('Device Ready');
}

$(document).on('click', '#vidlist li', function() {
	showVideo($(this).attr('videoId'));
});


$(document).bind("pageinit", function() {
	var channel = 'UC-0QtxHQwuQSHebab3LHAug';
	console.log('Channel: ' + channel);
	getPlaylist(channel);
	showRaceTrack();
});

$(document).on('click', '#racetrack', function() {
	showRaceTrack();
	refreshMap();
});

function refreshMap() {
	x = map.getZoom();
	c = map.getCenter();
	console.log('Triggering resize during click zoom: ' + x);
	google.maps.event.trigger(map,'resize');
	map.setZoom(x);
	map.setCenter(c);
}

function getPlaylist(channel) {
	$('#vidlist').html('');
	$.get(
		"https://www.googleapis.com/youtube/v3/search",
		{
			part: 'snippet',
			channelId: channel,
			key: 'AIzaSyD4tJv6Pr1B3LIgS0zxincojbBUW4bf6Kk', 
		},
		function(data){
			var output;
			var notSet = true;
			for (var i = 0; i < data.items.length; i++) {
				console.log(data.items[i]);
				videoId = data.items[i].id.videoId;
				title = data.items[i].snippet.title;
				thumb = data.items[i].snippet.thumbnails.default.url;
				if ( videoId ) {
					console.log('VideoId: ' + videoId);
					$('#vidlist').append('<li videoId="'+videoId+'"><div><img src="'+thumb+'" width="80" height="50"></div><h3>'+title+'</h3></li>');
					$('#vidlist:visible').listview('refresh');
					if ( notSet ) {
						var aprLastUploaded = localStorage.getItem('aprLastUploaded');
						if ( aprLastUploaded == null || aprLastUploaded == '') {
							console.log('Setting aprLastUploaded to ' + videoId);
							localStorage.setItem('aprLastUploaded', videoId);
						}
					}
				}
			}
			
		}
	);
}


function showVideo(id) {
	$('#videologo').hide();
	var output = '<iframe width="100%" height="250" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen></iframe>';
	console.log('Showing Video ' + output);
	$('#showVideo').html(output);
}

watch_id = null;    // ID of the geolocation
startLatLng = null;
stopLatLng = null; 
myLatLng = null;
map = null;
var zoom = 16;
directionsService = null;
_directionsRenderer = '';
marker = null;
var trackingData = [];
var distanceTotal = 0;
var trackerIcon = null;



function showRaceTrack() {
    	console.log('In showRaceTrack');
    	var defaultLatLng = new google.maps.LatLng(12.919710, 77.688186);  // Default APR Project office
    	if ( navigator.geolocation ) {
		directionsService = new google.maps.DirectionsService();
	  	_directionsRenderer = new google.maps.DirectionsRenderer();
		_directionsRenderer.setOptions({
	       		draggable: false,
			scrollwheel:false
    		});
        	function success(pos) {
		    	console.log('success method in showRaceTrack' + pos.coords.latitude);
            		// Location found, show map with these coordinates
            		drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
			
        	}
        	function fail(error) {
            		drawMap(defaultLatLng);  // Failed to find location, show default map
        	}
        	// Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        	navigator.geolocation.getCurrentPosition(success, fail, {maximumAge: 500000, enableHighAccuracy:true, timeout: 6000});

    	} else {
        	drawMap(defaultLatLng);  // No geolocation support, show default map
    	}

    	function drawMap(latlng) {
		console.log('drawMap ' + latlng);
        	var myOptions = {
            		zoom: zoom,
            		center: latlng,
            		mapTypeId: google.maps.MapTypeId.ROADMAP
        	};
        	map = new google.maps.Map(document.getElementById('map-canvas'), myOptions);
		startLatLng = new google.maps.LatLng(12.920080, 77.688076);  
		stopLatLng = new google.maps.LatLng(12.920080, 77.688076); 		
		load5KPoints();
		_directionsRenderer.setMap(map);
		_directionsRenderer.setPanel(document.getElementById('right-panel'));
     	}
}

function setDistance(distance) {
	km_distance = distance/1000;
	km_distance = Math.round(km_distance * 100)/100;
	console.log('Setting distance to ' + km_distance);
	$("#kms").html(', ' + km_distance + ' Kms');
}

function deleteMarker() {
	// Delete Existing Marker
	if ( marker != null ) {
		console.log('Deleting prior marker');
		marker.setMap(null);
		marker = null;
	}
}

function startTracking() {
    console.log('In startTracking'); 
    $('#startTracking').prop('disabled', true);
    $('#stopTracking').prop('disabled', false);

    // Start tracking the User
     watch_id = navigator.geolocation.watchPosition(function(position){
     	myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	console.log('MyLatLng ' + myLatLng);
     	map.setCenter(myLatLng);
	deleteMarker();
	if ( trackerIcon == null ) {
		trackerIcon = {
    			url: "img/area-512.png", // url
    			scaledSize: new google.maps.Size(50, 50), // scaled size
    			anchor: new google.maps.Point(25,25) // anch5or 
		};
	}
	marker = new google.maps.Marker({
     		   	position: myLatLng,
			icon: trackerIcon,
        		map: map
     	});
     	marker.setPosition(myLatLng);
	trackingData.push(myLatLng);
	refreshMap();
	console.log('Tracking Data ' + trackingData);
	if ( trackingData != null && trackingData.length > 1) {
		console.log('Tracking Data Length ' + trackingData.length);
		distanceTotal = 0;
		for (var i = 0; i < trackingData.length - 1; i++) {
    			distanceTotal += google.maps.geometry.spherical.computeDistanceBetween(trackingData[i], trackingData[i+1]);
		}
		setDistance(distanceTotal);
	}
    },
    // Error
    function(error){
       console.log(error);
    },
         
    // Settings
    { timeout: 5000, enableHighAccuracy: true }
   ); 
}

function stopTracking() {
	console.log('In stopTracking ' + watch_id);    
        $('#startTracking').prop('disabled', false);
	$('#stopTracking').prop('disabled', true);
	navigator.geolocation.clearWatch(watch_id);
	trackingData = [];
	distanceTotal = 0;
	setDistance(0.0);
	deleteMarker();
}

function load5KPoints() {
	console.log('load5KPoints');
	var _waypoints = new Array();
	tmpLatLng = new google.maps.LatLng(12.9195035, 77.6946959); // Clubhouse gate
	 _waypoints.push({
         	location: tmpLatLng,
         	stopover: true  //stopover is used to show marker on map for waypoints
         });
	tmpLatLng =  new google.maps.LatLng(12.922324, 77.691749); // Lane 6
	 _waypoints.push({
         	location: tmpLatLng,
         	stopover: true  //stopover is used to show marker on map for waypoints
         });
	tmpLatLng =  new google.maps.LatLng(12.920756, 77.685507); // RMZ Ecoworld opposite
	 _waypoints.push({
         	location: tmpLatLng,
         	stopover: true  //stopover is used to show marker on map for waypoints
         });
	tmpLatLng =  new google.maps.LatLng(12.928954, 77.684692); // Intel
	 _waypoints.push({
         	location: tmpLatLng,
         	stopover: true  //stopover is used to show marker on map for waypoints
         });
	tmpLatLng =  new google.maps.LatLng(12.922098, 77.682877); // Inside RMZ Ecoworld 1
	 _waypoints.push({
         	location: tmpLatLng,
         	stopover: true  //stopover is used to show marker on map for waypoints
         });
	tmpLatLng =  new google.maps.LatLng(12.921764, 77.684250); // Inside RMZ Ecoworld 2
	 _waypoints.push({
         	location: tmpLatLng,
         	stopover: true  //stopover is used to show marker on map for waypoints
         });
	drawRoute(startLatLng, stopLatLng, _waypoints);
}

//drawRoute() will help actual draw the route on map.
function drawRoute(originAddress, destinationAddress, _waypoints) {
    //Define a request variable for route .
    var _request = '';
    console.log('drawRoute : ' + originAddress + ' ' + destinationAddress + ' ' + _waypoints); 
    //This is for more then two locatins
    if (_waypoints.length > 0) {
        _request = {
            origin: originAddress,
            destination: destinationAddress,
            waypoints: _waypoints,
            optimizeWaypoints: false, //set to true if you want google to determine the shortest route or false to use the order specified.
            travelMode: google.maps.DirectionsTravelMode.WALKING
        };
    } else {
        //This is for one or two locations. Here noway point is used.
        _request = {
            origin: originAddress,
            destination: destinationAddress,
            travelMode: google.maps.DirectionsTravelMode.WALKING
        };
    }
 
    //This will take the request and draw the route and return response and status as output
    directionsService.route(_request, function (_response, _status) {
	console.log('Status ' + status);
        if (_status == google.maps.DirectionsStatus.OK) {
            _directionsRenderer.setDirections(_response);
        }
    });
}						

function autoUpdate() {
    navigator.geolocation.getCurrentPosition(function(position) {  
    var newPoint = new google.maps.LatLng(position.coords.latitude, 
                                          position.coords.longitude);
    console.log('autoUpdate ' + newPoint);

    if (marker) {
      // Marker already created - Move it
      marker.setPosition(newPoint);
    }
    else {
      // Marker does not exist - Create it
      marker = new google.maps.Marker({
        position: newPoint,
	icon: 'img/act-apr-chartitable-trust-mapicon.png',
        map: map
      });
    }

    // Center the map on the new position
    map.setCenter(newPoint);
  }); 

  // Call the autoUpdate() function every 5 seconds
  setTimeout(autoUpdate, 5000);
}

