$(function() {
    
    var hours = minutes = seconds = 0;
    var prev_hours = prev_minutes = prev_seconds = undefined;
    var timeUpdate;
	
    // Start/Pause/Resume button onClick
    $("#start_pause_resume").button().click(function(){
        // Start button
        if($(this).text() == "Start"){  // check button label
	    setPaused(false);

            $(this).html("<span class='ui-button-text'>Pause</span>");
            updateTime(0,0,0);
	    startTracking();

        }
	// Pause button
        else if($(this).text() == "Pause"){
            clearInterval(timeUpdate);
            $(this).html("<span class='ui-button-text'>Resume</span>");
	    setPaused(true);
        }
	// Resume button		
        else if($(this).text() == "Resume"){
	    setPaused(false);
            prev_hours = parseInt($("#hours").html());
            prev_minutes = parseInt($("#minutes").html());
            prev_seconds = parseInt($("#seconds").html());
            
            updateTime(prev_hours, prev_minutes, prev_seconds);
            
            $(this).html("<span class='ui-button-text'>Pause</span>");
        }
    });
    
    // Reset button onClick
    $("#reset").button().click(function(){
        if(timeUpdate) clearInterval(timeUpdate);
        setStopwatch(0,0,0);
        $("#start_pause_resume").html("<span class='ui-button-text'>Start</span>");
	stopTracking();
    });
    
    // Update time in stopwatch periodically - every 25ms
    function updateTime(prev_hours, prev_minutes, prev_seconds){
        var startTime = new Date();    // fetch current time
        
        timeUpdate = setInterval(function () {
            var timeElapsed = new Date().getTime() - startTime.getTime();    // calculate the time elapsed in milliseconds
            
            // calculate hours                
            hours = parseInt(timeElapsed / 1000 / 60 / 60) + prev_hours;
            
            // calculate minutes
            minutes = parseInt(timeElapsed / 1000 / 60) + prev_minutes;
            if (minutes > 60) minutes %= 60;
            
            // calculate seconds
            seconds = parseInt(timeElapsed / 1000) + prev_seconds;
	    if ( seconds > 60 ) seconds %= 60;
	  

            // set the stopwatch
            setStopwatch(hours, minutes, seconds);
            
        }, 25); // update time in stopwatch after every 25ms
        
    }
    
    // Set the time in stopwatch
    function setStopwatch(hours, minutes, seconds){
        $("#hours").html(prependZero(hours, 2));
        $("#minutes").html(prependZero(minutes, 2));
        $("#seconds").html(prependZero(seconds, 2));
    }
    
    // Prepend zeros to the digits in stopwatch
    function prependZero(time, length) {
        time = new String(time);    // stringify time
        return new Array(Math.max(length - time.length + 1, 0)).join("0") + time;
    }

});