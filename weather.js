// Weather API configuration
const weatherApi = {
    key: '4eb3703790b356562054106543b748b2',
    baseUrl: 'https://api.openweathermap.org/data/2.5/weather',
    forecastUrl: 'https://api.openweathermap.org/data/2.5/forecast'
};

// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const weatherInfo = document.getElementById('weatherInfo');
const hourlyForecast = document.getElementById('hourlyForecast');
const tabs = document.querySelectorAll('.tab');
const dateNavs = document.querySelectorAll('.date-nav');
const currentDate = document.getElementById('currentDate');
const locationEl = document.getElementById('location');
const temperatureEl = document.getElementById('temperature');
const descriptionEl = document.getElementById('description');
const iconEl = document.getElementById('weatherIcon');
const summaryEl = document.getElementById('weatherSummary');

let forecastData = [];
let currentDayIndex = 0;

// Adjust to IST (UTC+5:30)
const now = new Date();
now.setMinutes(now.getMinutes() + 330); // Set to 11:23 PM IST, August 06, 2025
const todayDate = new Date('2025-08-06T23:23:00Z').toISOString().split('T')[0];

// Event Listeners
locationInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') searchButton.click();
});

searchButton.addEventListener('click', () => {
    const city = locationInput.value.trim();
    if (city) fetchWeatherData(city);
    else alert("Please enter a city name.");
});

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        updateWeatherDisplay(tab.getAttribute('data-tab'));
    });
});

dateNavs.forEach(nav => {
    nav.addEventListener('click', () => {
        if (nav.getAttribute('data-date') === 'prev' && currentDayIndex > 0) {
            currentDayIndex--;
        } else if (nav.getAttribute('data-date') === 'next' && currentDayIndex < forecastData.length - 1) {
            currentDayIndex++;
        }
        displayDayForecast(forecastData[currentDayIndex]);
    });
});

// Fetch weather data
async function fetchWeatherData(city) {
    // Debug: Check which elements are missing
    const missingElements = [];
    if (!locationInput) missingElements.push('locationInput');
    if (!searchButton) missingElements.push('searchButton');
    if (!weatherInfo) missingElements.push('weatherInfo');
    if (!hourlyForecast) missingElements.push('hourlyForecast');
    if (!currentDate) missingElements.push('currentDate');
    if (!locationEl) missingElements.push('location');
    if (!temperatureEl) missingElements.push('temperature');
    if (!descriptionEl) missingElements.push('description');
    if (!iconEl) missingElements.push('weatherIcon');
    if (!summaryEl) missingElements.push('weatherSummary');
    if (missingElements.length > 0) {
        console.error('Missing DOM elements:', missingElements);
        return;
    }

    try {
        const response = await fetch(`${weatherApi.baseUrl}?q=${encodeURIComponent(city)}&appid=${weatherApi.key}&units=metric`);
        if (!response.ok) throw new Error(`City "${city}" not found`);

        const weather = await response.json();
        locationEl.innerText = `${weather.name}, ${weather.sys.country}`;

        const forecast = await fetchForecastData(city);
        forecastData = groupForecastByDay(forecast.list);
        currentDayIndex = 0; // Start with today
        displayDayForecast(forecastData[currentDayIndex]);
        updateWeatherDisplay('today');
    } catch (error) {
        weatherInfo.innerText = error.message;
        weatherInfo.style.color = 'red';
        console.error(error);
    }
}

// Fetch forecast data
async function fetchForecastData(city) {
    const response = await fetch(`${weatherApi.forecastUrl}?q=${encodeURIComponent(city)}&appid=${weatherApi.key}&units=metric`);
    if (!response.ok) throw new Error(`Forecast for "${city}" not found`);
    return response.json();
}

// Group forecast by day
function groupForecastByDay(list) {
    const days = {};
    list.forEach(item => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!days[date]) days[date] = [];
        days[date].push(item);
    });
    return Object.values(days);
}

// Display forecast for one day
function displayDayForecast(dayData) {
    if (!dayData || dayData.length === 0) return;

    const day = dayData[0];
    const date = new Date(day.dt * 1000);

    currentDate.textContent = date.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    temperatureEl.innerText = `${Math.round(day.main.temp)}°C`;
    descriptionEl.innerText = day.weather[0].description;

    iconEl.src = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
    iconEl.alt = `${day.weather[0].description} icon`;
    iconEl.style.display = 'block';

    summaryEl.innerText = `Expect ${day.weather[0].description}, temperature around ${Math.round(day.main.temp)}°C, wind speed of ${day.wind.speed} m/s, and humidity at ${day.main.humidity}%.`;

    displayHourlyForecast(dayData);
}

// Display hourly forecast table
function displayHourlyForecast(dayData) {
    const tbody = hourlyForecast.querySelector('tbody');
    tbody.innerHTML = '';
    dayData.forEach(hour => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${Math.round(hour.main.temp)}°C</td>
            <td>${hour.wind.speed} m/s</td>
            <td>${hour.main.humidity}%</td>
        `;
        tbody.appendChild(row);
    });
}

// Switch between Today / Tomorrow tabs
function updateWeatherDisplay(tab) {
    if (!forecastData.length) return;
    currentDayIndex = tab === 'today' ? 0 : 1; // Today = 0, Tomorrow = 1 (August 06 and 07, 2025)
    displayDayForecast(forecastData[currentDayIndex]);
}

// Disable navigation buttons when at boundaries
function updateNavigationButtons() {
    dateNavs.forEach(nav => {
        if (nav.getAttribute('data-date') === 'prev') nav.disabled = currentDayIndex <= 0;
        else nav.disabled = currentDayIndex >= forecastData.length - 1;
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    locationInput.focus();
    // Uncomment to test with a default city
    // fetchWeatherData('Visakhapatnam');
});