async function getWeather() {
    try {
        // First, get the coordinates for Rochester, NY
        const pointsResponse = await fetch('https://api.weather.gov/points/43.1566,-77.6088');
        const pointsData = await pointsResponse.json();

        // Get the hourly forecast URL instead of daily
        const forecastResponse = await fetch(pointsData.properties.forecastHourly);
        const forecastData = await forecastResponse.json();

        // Get the current temperature from the first period
        const temp = Math.round(forecastData.properties.periods[0].temperature);

        // Add some console logging for debugging
        console.log('Temperature:', temp);

        const weatherSpan = document.getElementById('weather');
        if (weatherSpan) {
            weatherSpan.textContent = ` (${temp}°F)`;
        } else {
            console.error('Weather span not found');
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
        console.log('Detailed error:', error.message);
    }
}

// Add event listener to ensure DOM is loaded
document.addEventListener('DOMContentLoaded', getWeather);