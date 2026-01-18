// Function to get weather data from Open-Meteo API
async function getWeather(city) {
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');

        const { latitude, longitude, name } = geoData.results[0];

        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
        );
        const weatherData = await weatherRes.json();

        return {
            city: name,
            temp: weatherData.current_weather.temperature,
            wind: weatherData.current_weather.windspeed,
            daily: weatherData.daily
        };
    } catch (err) {
        console.error(err);
        return null;
    }
}

function displayCurrentWeather(data) {
    const currentWeather = document.getElementById('currentWeather');
    currentWeather.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h3>${data.city}</h3>
                <p class="h4">${data.temp}°C</p>
                <p>Wind: ${data.wind} km/h</p>
            </div>
        </div>
    `;
}

function displayAlerts(data) {
    const alertSection = document.getElementById('alertSection');
    let alertHTML = '';

    if (data.temp >= 40) {
        alertHTML = `<div class="alert alert-danger">🔥 Heatwave Alert: Avoid outdoor work</div>`;
    } else if (data.temp <= 5) {
        alertHTML = `<div class="alert alert-warning">❄️ Cold Alert: Transport delays possible</div>`;
    } else {
        alertHTML = `<div class="alert alert-success">Weather Normal</div>`;
    }

    alertSection.innerHTML = alertHTML;
}

function displayImpact(data) {
    const impactText = document.getElementById('impactText');
    let impact = 'Normal operations';

    if (data.temp > 38) impact = "High heat may affect crop yield & worker productivity";
    if (data.wind > 30) impact = "High wind may delay logistics and transportation";

    impactText.innerText = impact;
}

function displayForecast(data) {
    const forecastSection = document.getElementById('forecastSection');
    forecastSection.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        forecastSection.innerHTML += `
        <div class="col-md-3 mb-3">
            <div class="card text-center">
                <div class="card-body">
                    <h6>${data.daily.time[i]}</h6>
                    <p>Max: ${data.daily.temperature_2m_max[i]}°C</p>
                    <p>Min: ${data.daily.temperature_2m_min[i]}°C</p>
                </div>
            </div>
        </div>
        `;
    }
}

async function displayComparison() {
    const comparisonCities = ["Delhi", "Mumbai", "Bangalore"];
    const comparisonTable = document.getElementById('comparisonTable');
    comparisonTable.innerHTML = '';

    for (let city of comparisonCities) {
        const data = await getWeather(city);
        if (!data) continue;

        let risk = data.temp > 38 ? 'High' : 'Medium';
        comparisonTable.innerHTML += `
        <tr>
            <td>${data.city}</td>
            <td>${data.temp}°C</td>
            <td>${data.wind} km/h</td>
            <td>${risk}</td>
        </tr>
        `;
    }
}

async function updateWeather(city) {
    const data = await getWeather(city);
    if (!data) {
        alert('City not found or API error!');
        return;
    }

    displayCurrentWeather(data);
    displayAlerts(data);
    displayImpact(data);
    displayForecast(data);
    displayComparison();
}

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const cityInput = document.getElementById('cityInput');

    updateWeather('Seattle');

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) updateWeather(city);
    });
});
