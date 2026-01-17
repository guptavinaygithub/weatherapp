async function getWeather(city) {
    try {
        // First get coordinates for the city
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        if (!geoResponse.ok) {
            throw new Error(`Geocoding API error! status: ${geoResponse.status}`);
        }
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        const { latitude, longitude, name } = geoData.results[0];

        // Then get weather data
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,windspeed_10m&timezone=auto`);
        if (!weatherResponse.ok) {
            throw new Error(`Weather API error! status: ${weatherResponse.status}`);
        }
        const weatherData = await weatherResponse.json();

        // Transform the data to match our expected format
        return {
            temp: weatherData.current_weather.temperature,
            humidity: weatherData.hourly.relative_humidity_2m ? weatherData.hourly.relative_humidity_2m[0] : 'N/A',
            wind_speed: weatherData.current_weather.windspeed,
            cloud_pct: 50, // Open-Meteo doesn't provide cloud percentage in free tier
            city_name: name
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

function displayWeather(data, city) {
    const weatherContainer = document.getElementById('weather-container');
    if (!data) {
        weatherContainer.innerHTML = '<div class="alert alert-danger">Failed to fetch weather data. Please try again.</div>';
        return;
    }

    const temp = data.temp;
    const humidity = data.humidity;
    const windSpeed = data.wind_speed;
    const cityName = data.city_name || city;
    const condition = data.cloud_pct > 50 ? 'Cloudy' : 'Clear'; // Simplified condition

    weatherContainer.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h2 class="card-title">${cityName}</h2>
                <div class="row">
                    <div class="col-md-6">
                        <h3>${temp}°C</h3>
                        <p class="text-muted">${condition}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Humidity:</strong> ${humidity}%</p>
                        <p><strong>Wind Speed:</strong> ${windSpeed} km/h</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.querySelector('form[role="search"]');
    const searchInput = document.querySelector('input[type="search"]');

    // Default city on load
    getWeather('Seattle').then(data => displayWeather(data, 'Seattle'));

    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const city = searchInput.value.trim();
        if (city) {
            const data = await getWeather(city);
            displayWeather(data, city);
        }
    });
});