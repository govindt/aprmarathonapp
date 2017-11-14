var isIos = false;
var channel = 'UC-0QtxHQwuQSHebab3LHAug';
var internetRequired = 'No Internet. Please connect to the internet';


$(document).ready(function() {
	document.addEventListener('deviceready', onDeviceReady,false);	
	if ( navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
		isIos = true;
	}
	console.log('isIos : ' + isIos);
	if ( isOnline() == false)
	{
    		alert(internetRequired);
	}
});

function onDeviceReady() {
	console.log('Device Ready');
}

$(document).on('click', '#vidlist li', function() {
	showVideo($(this).attr('videoId'));
});


$(document).bind("pageinit", function() {
	$("[data-role=panel] a").on("click", function () {
		if($(this).attr("href") == "#"+$.mobile.activePage[0].id) {
			$("[data-role=panel]").panel("close");
		}
	
	});
	console.log('Channel: ' + channel);
	if(isOnline() == true) {
		getPlaylist(channel);
	} else {
		alert(internetRequired);
	}
});

$(document).on('click', '#racetrack', function() {
	showRaceTrack();
});
function isOnline() {
	if (navigator.connection.type==0) {
    		alert(internetRequired);
		return false;
	} else if ( navigator.connection.type == 'none') {
	 	alert(internetRequired);
		return false;
	}
	else {
		return true;
	}
	
}

//var spreadSheetId = '1pdNANQ6_wdtVfIw_aLvHXxNddcHzM2oK0frrIJuVYtI';
//var spreadSheetRange = '5KM%20Runners!A:K';
var spreadSheetId = '1I1nR1tkdEp976nYlqFqRIwRgx9MrJeT6vM2Oupl8KMQ';
var spreadSheetRange = 'AllRacesForApp!A:K';
var authKey = 'AIzaSyAPyvyDNyL2gX_q4Lw3vR7Df7UbzFP4A1I';
var sample_url = 'https://sheets.googleapis.com/v4/spreadsheets/' + spreadSheetId + '/values:batchGet?ranges=' + spreadSheetRange + '&key=' +authKey;

$('#aprm_search_input').on("change", function(event) {
	if (isOnline() == true ) {
		readSpreadsheet(); 
	} else {
		alert(internetRequired);
	}
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
var leg = 0;
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
	color: 'black',
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

function loadPage(url) {
	window.parent.location = url;
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
					var str = '';
					if ( isIos == false ) {
						$('#vidlist').append('<li videoId="'+videoId+'"><div><img src="'+thumb+'" width="80" height="50"></div><h3>'+title+'</h3></li>');
					} else {
						str = '<li videoId="'+videoId+'"><div><a style="display:inline-block;text-decoration:none" onClick=loadPage("https://www.youtube.com/watch?v=' + videoId + '") href="#"><img src="'+thumb+'" width="80" height="50"></div><h3>'+title+'</h3></li>';
						$('#vidlist').append(str);
					}
					console.log(str);
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
	if ( navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
		console.log('Do Nothing');
		/*output='<video webkit-playsinline id="iosvideo" width="320" height="240" src="https://www.youtube.com/watch?v=' + id + '" controls>Your browser does not support the video tag.</video>'
		console.log('IOS Showing Video ' + output);
		$('#player').html(output);
		var video = document.getElementById('iosvideo');
		console.log('Video ' + video);
		video.load();
		console.log('Video loaded');
		video.play();
		console.log('Video Played');*/
	} else {
		console.log('Showing Video ' + output);
		$('#player').html(output);
	} 
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
	leg = 0;
	insertDirectionText('');
}

function loadMapInstructions() {
	console.log('loadMapInstructions');
	race = $("#select-race").val();
	console.log('Race Selected : ' + race);
	_instructions = new Array();
	var legIdx = 0;
	var distIdx = 0;
	if ( race == 1 ) {
		_instructions.push({
			distance: distIdx + 0.5,
			leg: ++legIdx,
			instruction: 'Make an U turn at the U turn point'
		});
	}
	else if ( race == 5 || race == 10 ) {
		_instructions.push({
			distance: distIdx + 0.6,
			leg: ++legIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Gate'
		});
		_instructions.push({
			distance: 0.86,
			leg: ++legIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
		});
		_instructions.push({
			distance: 1.59,
			leg: ++legIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
		});
		_instructions.push({
			distance: 1.81,
			leg: ++legIdx,
			instruction: 'Make a Right turn Adarsh Project Office Road'
		});
		_instructions.push({
			distance: 2.07,
			leg: ++legIdx,
			instruction: 'Make a right turn in front of the bay'
		});
		_instructions.push({
			distance: 3.08,
			leg: ++legIdx,
			instruction: 'Make a U turn at the U turn point'
		});
		_instructions.push({
			distance: 3.85,
			leg: ++legIdx,
			instruction: 'Make a right turn into the RMZ Eco world complex'
		});
		_instructions.push({
			distance: 4.14,
			leg: ++legIdx,
			instruction: 'Make a left turn'
		});
		_instructions.push({
			distance: 4.2,
			leg: ++legIdx,
			instruction: 'Make a left turn'
		});
		_instructions.push({
			distance: 4.45,
			leg: ++legIdx,
			instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
		});
		if ( race == 5 ) {
			_instructions.push({
				distance: 4.79,
				leg: ++legIdx,
				instruction: 'Make a left turn towards 5KM finish line'
			});
		} else { // 10KM
			_instructions.push({
				distance: 4.79,
				leg: ++legIdx,
				instruction: 'Make a loop and prepare for the 2nd loop'
			});
			_instructions.push({
				distance: 5.75,
				leg: ++legIdx,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Gate'
			});
			_instructions.push({
				distance: 6.02,
				leg: ++legIdx,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
			});
			_instructions.push({
				distance: 6.75,
				leg: ++legIdx,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
			});
			_instructions.push({
				distance: 6.99,
				leg: ++legIdx,
				instruction: 'Make a Right turn Adarsh Project Office Road'
			});
			_instructions.push({
				distance: 7.25,
				leg: ++legIdx,
				instruction: 'Make a right turn in front of the bay'
			});
			_instructions.push({
				distance: 8.24,
				leg: ++legIdx,
				instruction: 'Make a U turn at the U turn point'
			});
			_instructions.push({
				distance: 9.0,
				leg: ++legIdx,
				instruction: 'Make a right turn into the RMZ Eco world complex'
			});
			_instructions.push({
				distance: 9.27,
				leg: ++legIdx,
				instruction: 'Make a left turn'
			});
			_instructions.push({
				distance: 9.34,
				leg: ++legIdx,
				instruction: 'Make a left turn'
			});
			_instructions.push({
				distance: 9.58,
				leg: ++legIdx,
				instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
			});
			_instructions.push({
				distance: 9.91,
				leg: ++legIdx,
				instruction: 'Make a left turn towards 10KM finish line'
			});
		}
	} else if ( race == 21.1 ) {
		_instructions.push({
			distance: 0.6,
			leg: ++legIdx,
			instruction: 'Make a Right turn into the Adarsh Palm Retreat Phase 3'
		});
		_instructions.push({
			distance: 0.81,
			leg: ++legIdx,
			instruction: 'Make a Right turn at the next T junction'
		});
		_instructions.push({
			distance: 1.03,
			leg: ++legIdx,
			instruction: 'Make a Left turn at the next T junction'
		});
		_instructions.push({
			distance: 1.24,
			leg: ++legIdx,
			instruction: 'Make an about turn at the next dead end'
		});
		_instructions.push({
			distance: 1.44,
			leg: ++legIdx,
			instruction: 'Make a Right turn at the next T junction'
		});
		_instructions.push({
			distance: 1.67,
			leg: ++legIdx,
			instruction: 'Make a Left turn towards Phase 3 exit gate'
		});
		_instructions.push({
			distance: 1.9,
			leg: ++legIdx,
			instruction: 'Continue straight towards the Clubhouse gate'
		});
		_instructions.push({
			distance: 2.15,
			leg: ++legIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
		});
		_instructions.push({
			distance: 2.87,
			leg: ++legIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
		});
		_instructions.push({
			distance: 3.12,
			leg: ++legIdx,
			instruction: 'Make a Right turn Adarsh Project Office Road'
		});
		_instructions.push({
			distance: 3.39,
			leg: ++legIdx,
			instruction: 'Make a right turn in front of the bay'
		});
		_instructions.push({
			distance: 4.43,
			leg: ++legIdx,
			instruction: 'Make a U turn at the U turn point'
		});
		_instructions.push({
			distance: 5.24,
			leg: ++legIdx,
			instruction: 'Make a right turn into the RMZ Eco world complex'
		});
		_instructions.push({
			distance: 5.53,
			leg: ++legIdx,
			instruction: 'Make a left turn'
		});
		_instructions.push({
			distance: 5.6,
			leg: ++legIdx,
			instruction: 'Make a left turn'
		});
		_instructions.push({
			distance: 5.84,
			leg: ++legIdx,
			instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
		});
		_instructions.push({
			distance: 6.3,
			leg: ++legIdx,
			instruction: 'Proceed straight towards the T Junction'
		});
		_instructions.push({
			distance: 6.78,
			leg: ++legIdx,
			instruction: 'Make a right'
		});
		_instructions.push({
			distance: 6.94,
			leg: ++legIdx,
			instruction: 'Make a left'
		});
		_instructions.push({
			distance: 7.97,
			leg: ++legIdx,
			instruction: 'Make an about turn'
		});
		_instructions.push({
			distance: 9,
			leg: ++legIdx,
			instruction: 'Make a right'
		});
		_instructions.push({
			distance: 9.17,
			leg: ++legIdx,
			instruction: 'Make a left'
		});
		_instructions.push({
			distance: 9.8,
			leg: ++legIdx,
			instruction: 'Make a right and get ready for the second loop'
		});
		_instructions.push({
			distance: 10.07,
			leg: ++legIdx,
			instruction: 'Proceed straight of the second loop'
		});
		_instructions.push({
			distance: 10.19,
			leg: ++legIdx,
			instruction: 'Make a right and get ready for the second loop'
		});
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
	insertDirectionText(_instructions[leg].instruction + ' in ' + (_instructions[leg].distance - km_distance).toFixed(2) + ' kms');
	if ( km_distance > (_instructions[leg].distance - 0.2) && km_distance < _instructions[leg].distance ) {
		console.log('Instruction : ' + _instructions[leg].instruction);
		if ( typeof _instructions != 'undefined' || _instructions != null ) {
			speak(_instructions[leg].instruction);
			leg++;
		}
	}
}


