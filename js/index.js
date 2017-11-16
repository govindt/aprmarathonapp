var isIos = false;
var channel = 'UC-0QtxHQwuQSHebab3LHAug';
var internetRequired = 'No Internet. Please connect to the internet';
var startLatLng;
var awayFromStart = 1000;

$(document).ready(function() {
	document.addEventListener('deviceready', onDeviceReady,false);	
	if ( navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
		isIos = true;
	}
	console.log('isIos : ' + isIos);
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
	getPlaylist(channel);
});

$(document).on('click', '#racetrack', function() {
	showRaceTrack();
});

function isOnline() {
	if (navigator.connection.type==0) {
		toast(internetRequired);
		return false;
	} else if ( navigator.connection.type == 'none') {
 		toast(internetRequired);
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

function loadInstructions(data) {
	console.log('Load Instructions');
	if (typeof(data[0]) === 'undefined') {
		return null;
	} else {
		$.each(data, function( rowIndex, row ) {
	 		//bind header
			if(rowIndex == 0) {
				console.log('Ignoring first row');
			} else {
				var leg, latitude, longitude, instruction, distance;
				$.each(row, function( index, colData ) {
						if ( index == 0 )
							leg = colData;
						else if (index == 1)
							latitude = colData;
						else if (index == 2)
							longitude = colData;
						else if (index == 3)
							instruction = colData;
						else if (index == 4) {
							distance = colData;
							_instructions.push({
								leg: leg,
								latitude: latitude,
								longitude: longitude,
								instruction: instruction,
								distance: distance
							});
						}
						else
							console.log('Ignoring additional params');
				});
			}
		});
		console.log(_instructions);
	}
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
    	var defaultLatLng = new google.maps.LatLng(12.9198, 77.68908);  // Default APR Project office
	startLatLng = defaultLatLng;
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
			currentLatLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            		drawMap(currentLatLng);
			//awayFromStart = google.maps.geometry.spherical.computeDistanceBetween(startLatLng, currentLatLng);
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
	/*if ( trackingData != null && trackingData.length > 1) {
		console.log('Tracking Data Length ' + trackingData.length);
		distanceTotal = 0;
		for (var i = 0; i < trackingData.length - 1; i++) {
    			distanceTotal += google.maps.geometry.spherical.computeDistanceBetween(trackingData[i], trackingData[i+1]);
		}
		runningTotal += distanceTotal;
		setDistance(runningTotal);
		speakDirection();
		trackingData = [];
	}*/
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
	var distIdx = 0;
	if ( race == 1 ) {
		distIdx = 0.5;
		_instructions.push({
			distance: distIdx,
			instruction: 'Make an U turn at the U turn point'
		});
	}
	else if ( race == 5 || race == 10 ) {
		$.ajax({
	   		type: "GET",  
   			url: "5KDirections.csv",
			dataType: "text",       
			success: function(response)  
   			{
				console.log('Read the 5K instructions successfully!!');
			 	data = $.csv.toArrays(response);
				loadInstructions(data);
			}   
		 });
		/* distIdx = 0.6;
		_instructions.push({
			distance: distIdx,
			latitude: 12.91951,
			longitude: 77.69463,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Gate'
		});
		distIdx += 0.27; //0.87
		_instructions.push({
			distance: distIdx,
			latitude: 12.92194,
			longitude: 77.69474,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
		});
		distIdx += 0.73; //1.6
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
		});
		distIdx += 0.23;//1.83
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn Adarsh Project Office Road'
		});
		distIdx += 0.25; //2.08
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn in front of the bay'
		});
		distIdx += 1.0; //3.08
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a U turn at the U turn point'
		});
		distIdx += 0.79; //3.87
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn into the RMZ Eco world complex'
		});
		distIdx += 0.28; //4.15
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn'
		});
		distIdx += 0.06; //4.21
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn'
		});
		distIdx += 0.24; //4.45
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
		});*/
		if ( race == 5 ) {
			distIdx += 0.33 //4.78
			/*_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn towards 5KM finish line'
			});*/
		} else { // 10KM
			distIdx += 0.33 //4.78
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left and prepare for the 2nd loop'
			});
			//  Second loop 10K
			distIdx += 0.97 //5.75
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Gate'
			});
			distIdx += 0.27; //6.02
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
			});
			distIdx += 0.73; //6.75
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
			});
			distIdx += 0.23;//6.98
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a Right turn Adarsh Project Office Road'
			});
			distIdx += 0.25; //7.23
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a right turn in front of the bay'
			});
			distIdx += 1.0; //8.23
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a U turn at the U turn point'
			});
			distIdx += 0.79; //9.02
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a right turn into the RMZ Eco world complex'
			});
			distIdx += 0.28; //9.30
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn'
			});
			distIdx += 0.06; //9.36
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn'
			});
			distIdx += 0.24; //9.60
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
			});
			distIdx += 0.33 //9.93
			_instructions.push({
				distance: distIdx,
				instruction: 'Make a left turn towards 10KM finish line'
			});
		}
	} else if ( race == 21.1 ) {
		distIdx = 0.6;
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn into the Adarsh Palm Retreat Phase 3'
		});
		distIdx += 0.21;//0.81
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn at the next T junction'
		});
		distIdx += 0.22; //1.03
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Left turn at the next T junction'
		});
		distIdx += 0.21; //1.24
		_instructions.push({
			distance: distIdx,
			instruction: 'Make an about turn at the next dead end'
		});
		distIdx += 0.20; //1.44
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn at the next T junction'
		});
		distIdx += 0.22; //1.66
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Left turn towards Phase 3 exit gate'
		});
		distIdx += 0.21; //1.87
		_instructions.push({
			distance: distIdx,
			instruction: 'Continue straight towards the Clubhouse gate'
		});
		distIdx += 0.27; //2.14
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
		});
		distIdx += 0.73; //2.87
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
		});
		distIdx += 0.23; //3.10		
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn Adarsh Project Office Road'
		});
		distIdx += 0.25; //3.35
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn in front of the bay'
		});
		distIdx += 1.0; //4.35
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a U turn at the U turn point'
		});
		distIdx += 0.79; //5.14
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn into the RMZ Eco world complex'
		});
		distIdx += 0.28; //5.42
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn'
		});
		distIdx += 0.06; //5.48
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn'
		});
		distIdx += 0.24; //5.72
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
		});
		distIdx += 0.33; //6.15
		_instructions.push({
			distance: distIdx,
			instruction: 'Proceed straight towards the T Junction'
		});
		distIdx += 0.19; //6.34
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left at the T Junction'
		});
		distIdx += 0.48; //6.82
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn'
		});
		distIdx += 0.17; //6.99
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left'
		});
		distIdx += 1.02; // 8.01
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a U turn at the U turn point'
		});
		distIdx += 1.02; // 9.03
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right'
		});
		distIdx += 0.17; //9.20
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left'
		});
		distIdx += 0.48; //9.68
		_instructions.push({
			distance: 9.8,
			instruction: 'Make a right, right again and get ready for the second loop'
		});
		distIdx += 0.40; // 10.08
		_instructions.push({
			distance: distIdx,
			instruction: 'Proceed straight to the second loop'
		});
		distIdx += 0.71; // 10.79
		// Second Loop HM
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn into the Adarsh Palm Retreat Phase 3'
		});
		distIdx += 0.21; //11.0
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn at the next T junction'
		});
		distIdx += 0.22; //11.22
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Left turn at the next T junction'
		});
		distIdx += 0.21; //11.43
		_instructions.push({
			distance: distIdx,
			instruction: 'Make an about turn at the next dead end'
		});
		distIdx += 0.20; //11.63
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn at the next T junction'
		});
		distIdx += 0.22; //11.85
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Left turn towards Phase 3 exit gate'
		});
		distIdx += 0.21; //12.06
		_instructions.push({
			distance: distIdx,
			instruction: 'Continue straight towards the Clubhouse gate'
		});
		distIdx += 0.27; //12.33
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Main Road'
		});
		distIdx += 0.73; //13.06
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn into the Adarsh Palm Retreat Hotel Road'
		});
		distIdx += 0.23; //13.29
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a Right turn Adarsh Project Office Road'
		});
		distIdx += 0.25; //13.54
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn in front of the bay'
		});
		distIdx += 1.0; //14.54
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a U turn at the U turn point'
		});
		distIdx += 0.79; //15.33
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn into the RMZ Eco world complex'
		});
		distIdx += 0.28; //15.61
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn'
		});
		distIdx += 0.06; //15.67
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn'
		});
		distIdx += 0.24; //15.91
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left turn, quick right and an immediate right to exit to the main road'
		});
		distIdx += 0.33; //16.24
		_instructions.push({
			distance: distIdx,
			instruction: 'Proceed straight towards the T Junction'
		});
		distIdx += 0.19; //16.43
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left at the T Junction'
		});
		distIdx += 0.48; //16.91
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right turn'
		});
		distIdx += 0.17; //17.08
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left'
		});
		distIdx += 1.02; // 18.1
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a U turn at the U turn point'
		});
		distIdx += 1.02; // 19.12
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a right'
		});
		distIdx += 0.17; //19.29
		_instructions.push({
			distance: distIdx,
			instruction: 'Make a left'
		});
		distIdx += 0.48; //19.77
		_instructions.push({
			distance: 9.8,
			instruction: 'Make a right, right again and get ready for finsh'
		});
		// Finish is .27 - 20.04
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
	if ( leg == 0 ) { 
		// Starting Point
		prevLegLatLng = new google.maps.LatLng(_instructions[leg].latitude, _instructions[leg].longitude); 
		leg++;
	} else {
		nextLegLatLng = new google.maps.LatLng(_instructions[leg].latitude, _instructions[leg].longitude);
		distanceToNextLeg = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, nextLegLatLng);
		distanceToNextLeg = Math.round(distanceToNextLeg * 100)/100;
		insertDirectionText(_instructions[leg].instruction + ' in ' + (distanceToNextLeg/1000).toFixed(2) + ' kms ');
		prevLegLatLng = new google.maps.LatLng(_instructions[leg-1].latitude, _instructions[leg-1].longitude);	
		distanceCovered = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, prevLegLatLng);	
		distanceCovered = Math.round(distanceCovered * 100)/100;
		toast('Distance Covered: ' + distanceCovered + ' DistanceToNextLeg ' + distanceToNextLeg);
		if ( distanceToNextLeg < 20 ) { // Less than 20 mts
			speak(_instructions[leg].instruction);
			runningTotal = (_instructions[leg].distance * 1000);
			setDistance(runningTotal);
			leg++;
		} else {
			setDistance(runningTotal + distanceCovered);
		}
	}

	/*insertDirectionText(_instructions[leg].instruction + ' in ' + (_instructions[leg].distance - km_distance).toFixed(2) + ' kms');
	if ( km_distance > (_instructions[leg].distance - 0.2) && km_distance < _instructions[leg].distance ) {
		console.log('Instruction : ' + _instructions[leg].instruction);
		if ( typeof _instructions != 'undefined' || _instructions != null ) {
			speak(_instructions[leg].instruction);
			leg++;
		}
	}*/
}


