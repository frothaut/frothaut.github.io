function formatTime(utcTimeString) {
    const timeParts = utcTimeString.match(/(\d+):(\d+):(\d+) (\w+)/);
    let hours = parseInt(timeParts[1])+1;
    const minutes = timeParts[2];
    const seconds = timeParts[3];
    const ampm = timeParts[4];
    if (ampm === 'PM' && hours < 12) {
        hours += 12;
    } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
    }
    const dateString = `1970-01-01T${hours.toString().padStart(2, '0')}:${minutes}:${seconds}Z`;
    const utcDate = new Date(dateString);
    return utcDate.toLocaleTimeString('de-DE', {
        timeZone: 'Europe/Berlin', 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}
export function get_light() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lon = position.coords.longitude;
            const lat = position.coords.latitude;
            var url = 'https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lon + '&date=today';

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    const sunrise = data.results.civil_twilight_begin;
                    const sunset = data.results.civil_twilight_end;

                    document.getElementById('sunriseTime').innerText = formatTime(sunrise);
                    document.getElementById('sunsetTime').innerText = formatTime(sunset);
                })
                .catch(error => console.error('Error:', error));
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

document.getElementById('toggleSight').addEventListener('click', function() {
    var sidebar = document.getElementById('buechsenlicht');
    if (sidebar.style.display === 'none' || sidebar.style.display === '') {
        sidebar.style.display = 'block';
    } else {
        sidebar.style.display = 'none';
    }
});
