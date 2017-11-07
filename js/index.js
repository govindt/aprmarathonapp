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
});

$(document).on('click', '#racetrack', function() {
	showRaceTrack();
});

//var spreadSheetId = '1pdNANQ6_wdtVfIw_aLvHXxNddcHzM2oK0frrIJuVYtI';
//var spreadSheetRange = '5KM%20Runners!A:K';
var spreadSheetId = '1I1nR1tkdEp976nYlqFqRIwRgx9MrJeT6vM2Oupl8KMQ';
var spreadSheetRange = 'AllRacesForApp!A:K';
var authKey = 'AIzaSyAPyvyDNyL2gX_q4Lw3vR7Df7UbzFP4A1I';
var sample_url = 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadSheetId + '/values:batchGet?ranges=' + spreadSheetRange + '&key=' +authKey;

$('#aprm_search_input').on("change", function(event) {
	readSpreadsheet();
});

watch_id = null;    // ID of the geolocation
myLatLng = null;
map = null;
var zoom = 16;
directionsService = null;
var _directionsRenderer;
marker = null;
var trackingData = [];
var _instructions = new Array();
var distanceTotal = 0;
var runningTotal = 0;
var km_distance = 0;
var trackerIcon = null;
var paused = false;
var leg = 1;
var race = 5;

function checkEmpty(myVar) {	
	if (typeof myVar == 'undefined' || myVar == null ) {
		return '';
	} else { 
		return myVar;
	}
}
function toast(message) {
    var $toast = $('<div class="ui-loader ui-overlay-shadow ui-body-e ui-corner-all"><h3>' + message + '</h3></div>');

    $toast.css({
        display: 'block', 
        background: '#fff',
        opacity: 0.90, 
        position: 'fixed',
        padding: '7px',
        'text-align': 'center',
        width: '270px',
        left: ($(window).width() - 284) / 2,
        top: $(window).height() / 2 - 20
    });

    var removeToast = function(){
        $(this).remove();
    };

    $toast.click(removeToast);

    $toast.appendTo($.mobile.pageContainer).delay(2000);
    $toast.fadeOut(400, removeToast);
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
	// <iframe style="width:100%; height:221px;" src="https://www.youtube.com/embed/uFyaDBmvR8c?showinfo=0" frameborder="0" allowfullscreen></iframe>

	var output = '<iframe width="100%" height="250" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen></iframe>';
	if ( navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
		output = '<iframe style="width:100%; height:221px;" src="https://www.youtube.com/embed/' + id + '?showinfo=0" frameborder="0" allowfullscreen></iframe>';
		var video = document.getElementById("showVideo");
		video.setAttribute('webkit-playsinline', 'webkit-playsinline');// Fix fullscreen problem on IOS 8 and 9
		video.setAttribute('playsinline', 'playsinline');// Fix fullscreen problem on IOS 10
		$('#showVideo').html(output);
	else {
		$('#showVideo').html(output);
	}
	console.log('Showing Video ' + output);
}



function setPaused(val) {
	console.log('Setting paused to ' + val);
	paused = val;
}

function showRaceTrack() {
    	console.log('In showRaceTrack');
    	var defaultLatLng = new google.maps.LatLng(12.919710, 77.688186);  // Default APR Project office
    	if ( navigator.geolocation ) {
		directionsService = new google.maps.DirectionsService();
		_directionsRenderer = new google.maps.DirectionsRenderer();
		_directionsRenderer.setOptions({
	       		draggable: false,
			scrollwheel:false,
			zoomControl: false,
			disableDoubleClickZoom: true,
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
		console.log('Showing default');
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
		loadMapInstructions();
		_directionsRenderer.setMap(map);
     	}
}

function setDistance(distance) {
	console.log('Setting distance to ' + distance);
	if ( distance != 0 ) {
		if ( !paused ) {
			km_distance = distance/1000;	
			km_distance = Math.round(km_distance * 100)/100;
			$("#kms").html(km_distance);
		} 
	} else {
		km_distance = 0;
		$("#kms").html('0.0');
	}
}

function deleteMarker() {
	// Delete Existing Marker
	if ( typeof marker != 'undefined' && marker != null ) {
		console.log('Deleting prior marker');
		marker.setMap(null);
		marker = null;
	}
}

function startTracking() {
    	console.log('In startTracking'); 
    	$('#startTracking').prop('disabled', true);
    	$('#stopTracking').prop('disabled', false);
	$('#select-race').prop('disabled', 'disabled');

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
	console.log('Tracking Data ' + trackingData);
	speakDirection();
	if ( trackingData != null && trackingData.length > 1) {
		console.log('Tracking Data Length ' + trackingData.length);
		distanceTotal = 0;
		for (var i = 0; i < trackingData.length - 1; i++) {
    			distanceTotal += google.maps.geometry.spherical.computeDistanceBetween(trackingData[i], trackingData[i+1]);
		}
		runningTotal += distanceTotal;
		setDistance(runningTotal);
		speakDirection();
		trackingData = [];
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
	$('#select-race').prop('disabled', false);
	navigator.geolocation.clearWatch(watch_id);
	trackingData = [];
	distanceTotal = 0;
	runningTotal = 0;
	setDistance(0.0);
	deleteMarker();
	leg = 1;
}

function loadMapInstructions() {
	console.log('loadMapInstructions');
	race = $("#select-race").val();
	console.log('Race Selected : ' + race);
	_instructions = new Array();
	if ( race == 1 ) {
		_instructions.push({
			distance: 0.5,
			leg: 1,
			instruction: 'Make an U turn at the U turn point'
		});
	}
	else if ( race == 5 || race == 10 ) {
		_instructions.push({
			distance: 0.6,
			leg: 1,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Gate'
		});
		_instructions.push({
			distance: 0.86,
			leg: 2,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
		});
		_instructions.push({
			distance: 1.59,
			leg: 3,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
		});
		_instructions.push({
			distance: 1.81,
			leg: 4,
			instruction: 'Make a Right turn Adarsh Project Office Road'
		});
		_instructions.push({
			distance: 2.07,
			leg: 5,
			instruction: 'Make a right turn in front of the bay'
		});
		_instructions.push({
			distance: 3.08,
			leg: 6,
			instruction: 'Make a U turn at the U turn point'
		});
		_instructions.push({
			distance: 3.85,
			leg: 7,
			instruction: 'Make a right turn into the RMZ Eco world complex'
		});
		_instructions.push({
			distance: 4.14,
			leg: 8,
			instruction: 'Make a left turn'
		});
		_instructions.push({
			distance: 4.2,
			leg: 9,
			instruction: 'Make a left turn'
		});
		_instructions.push({
			distance: 4.45,
			leg: 10,
			instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
		});
		if ( race == 5 ) {
			_instructions.push({
				distance: 4.79,
				leg: 11,
				instruction: 'Make a left turn towards 5KM finish line'
			});
		} else { // 10KM
			_instructions.push({
				distance: 4.79,
				leg: 11,
				instruction: 'Make a loop and prepare for the 2nd loop'
			});
			_instructions.push({
				distance: 5.75,
				leg: 12,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Gate'
			});
			_instructions.push({
				distance: 6.02,
				leg: 13,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
			});
			_instructions.push({
				distance: 6.75,
				leg: 14,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
			});
			_instructions.push({
				distance: 6.99,
				leg: 15,
				instruction: 'Make a Right turn Adarsh Project Office Road'
			});
			_instructions.push({
				distance: 7.25,
				leg: 16,
				instruction: 'Make a right turn in front of the bay'
			});
			_instructions.push({
				distance: 8.24,
				leg: 17,
				instruction: 'Make a U turn at the U turn point'
			});
			_instructions.push({
				distance: 9.0,
				leg: 18,
				instruction: 'Make a right turn into the RMZ Eco world complex'
			});
			_instructions.push({
				distance: 9.27,
				leg: 19,
				instruction: 'Make a left turn'
			});
			_instructions.push({
				distance: 9.34,
				leg: 20,
				instruction: 'Make a left turn'
			});
			_instructions.push({
				distance: 9.58,
				leg: 21,
				instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
			});
			_instructions.push({
				distance: 9.91,
				leg: 11,
				instruction: 'Make a left turn towards 10KM finish line'
			});
		}
	} else if ( race == 21.1 ) {
	} else
		console.log('Unknown Race');
	
	drawAjaxRoute();
}

function readSpreadsheet() {
	var value = $('#aprm_search_input').val();
	if (checkEmpty(value) == '' ) {
		$("#aprm_run_details_data").html('');
		return '';
	}
	console.log('Value: ' + value);
	console.log(sample_url);
	$.ajax(sample_url).done(function(result){
		found = false;
		if ( result != null ) {
			var valueRanges = new Array();
			valueRanges = result.valueRanges;
			var myRow = "";
			for ( var i = 0; i < valueRanges.length; i++ ) {
				var values = new Array();
				values = valueRanges[i].values;
				for ( var j = 0; j < values.length; j++) {
					if ( values[j][6].toLowerCase() == value.toLowerCase() ) {
						myRow += "<tr>";
						myRow +=  "<td width='20%'>" + checkEmpty(values[j][0]) + "</td>";
						myRow +=  "<td width='20%'>" + values[j][1] + "</td>";
						myRow +=  "<td width='20%'>" + values[j][4] + "</td>";
						myRow +=  "<td width='20%'>" + checkEmpty(values[j][10]) + "</td>";
						myRow +=  "<td width='20%'>" + values[j][8] + "</td>";
						myRow +=  "</tr>";
						found = true;
					}
					if ( j == values.length - 1) {
				                console.log(myRow);
						if ( found == true ) 
							$("#aprm_run_details_data").html(myRow);
						else
							$("#aprm_run_details_data").html("No Results found");	
					}

				}
			}
		}
        });
}

function drawAjaxRoute() {
	console.log('drawAjaxRoute');
	var route_url, stroke_color;
	if ( race == 5 ) {
		route_url = "5KRoute.gpx";
		stroke_color = "green";
	} else if ( race == 10 ) {
		route_url = "10KRoute.gpx";
		stroke_color = "red";
	} else if ( race == 21.1 ) {
		route_url = "HMRoute.gpx";
		stroke_color = "blue";
	} else if ( race == 1 ) {
		route_url = "1KRoute.gpx";
		stroke_color = "#800080";
	}
	console.log("Route URL : " + route_url);
	$.ajax({
  	type: "GET",
  	url: route_url,
  	dataType: "xml",
  	success: function(xml) {
		console.log('drawAjaxRoute::Success');
		var points = [];
		var bounds = new google.maps.LatLngBounds ();
		$(xml).find("trkpt").each(function() {
		 	var lat = $(this).attr("lat");
	  		var lon = $(this).attr("lon");
			var p = new google.maps.LatLng(lat, lon);
		  	points.push(p);
	  		bounds.extend(p);
	});

	var poly = new google.maps.Polyline({
	  // use your own style here
	  path: points,
	  strokeColor: stroke_color,
	  strokeOpacity: .7,
	  strokeWeight: 4
	});
	
	poly.setMap(map);
	
	// fit bounds to track
	map.fitBounds(bounds);
	}
	});
}

function insertDirectionText (distanceText) {
    	document.getElementById('aprm_map_directions_td').innerHTML = distanceText;
}

function insertDirectionIcon (trafficIcon) {
	console.log(trafficIcon);
	var image = document.getElementById('aprm_map_icon_img');
	image.src = trafficIcon;
}

function speakDirection() {
	//toast('Distance ' + km_distance + ' Leg: ' + leg + ' I Distance ' + _instructions[leg].distance);
	insertDirectionText(_instructions[leg].instruction + ' in ' + (_instructions[leg].distance - km_distance) + ' kms');
	if ( km_distance > (_instructions[leg].distance - 0.2) && km_distance < _instructions[leg].distance ) {
		console.log('Instruction : ' + _instructions[leg].instruction);
		if ( typeof _instructions != 'undefined' || _instructions != null ) {
			speak(_instructions[leg].instruction);
			leg++;
		}
	}
}

