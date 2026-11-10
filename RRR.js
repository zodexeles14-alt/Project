document.addEventListener('DOMContentLoaded', () => {
    const emergencyButtons = document.querySelectorAll('.emergency-btn');
    const getGpsBtn = document.getElementById('getGpsBtn');
    const gpsStatus = document.getElementById('gpsStatus');
    const submitBtn = document.getElementById('submitEmergencyBtn');

    let selectedEmergency = 'Fire'; // default selection
    let userCoordinates = null;

    // 1. Toggle Selection on Quick Emergency Buttons
    emergencyButtons.forEach(button => {
        button.addEventListener('click', () => {
            emergencyButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectedEmergency = button.getAttribute('data-type');
        });
    });

    // 2. Fetch User GPS Location
    function FetchLocation() {
        if (!navigator.geolocation) {
            gpsStatus.style.color = '#ef4444';
            gpsStatus.textContent = 'Geolocation is not supported by your browser.';
            return;
        }

        gpsStatus.style.color = '#38bdf8';
        gpsStatus.textContent = 'Fetching current location...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                userCoordinates = { latitude, longitude };

                gpsStatus.style.color = '#4ade80'; // Success green
                gpsStatus.textContent = `Location Captured: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            },
            (error) => {
                gpsStatus.style.color = '#ef4444'; // Error red
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        gpsStatus.textContent = 'Location permission denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        gpsStatus.textContent = 'Location unavailable.';
                        break;
                    case error.TIMEOUT:
                        gpsStatus.textContent = 'Location request timed out.';
                        break;
                    default:
                        gpsStatus.textContent = 'An unknown error occurred.';
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // Trigger GPS on button click
    getGpsBtn.addEventListener('click', FetchLocation);

    // 3. Submit Report with GPS Data & Save to LocalStorage
    submitBtn.addEventListener('click', () => {
        if (!userCoordinates) {
            alert('Please click "Get Current Location" before submitting so responders can locate you.');
            return;
        }

        const newIncident = {
            category: selectedEmergency,
            lat: userCoordinates.latitude,
            lng: userCoordinates.longitude,
            info: `Custom Report (${userCoordinates.latitude.toFixed(2)}, ${userCoordinates.longitude.toFixed(2)})`,
            time: "Just now",
            severity: "badge-critical"
        };

        // Save to LocalStorage so it persists and displays dynamically
        const savedIncidents = JSON.parse(localStorage.getItem('safeResponseIncidents')) || [];
        savedIncidents.push(newIncident);
        localStorage.setItem('safeResponseIncidents', JSON.stringify(savedIncidents));

        alert(`Emergency Reported Successfully!\nType: ${selectedEmergency}\nLatitude: ${userCoordinates.latitude.toFixed(4)}\nLongitude: ${userCoordinates.longitude.toFixed(4)}`);
        
        // Refresh markers and feed
        loadAndDisplayIncidents();
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then((reg) => console.log('Service worker registered successfully:', reg.scope))
                .catch((err) => console.log('Service worker registration failed:', err));
        });
    }

    // 4. Initialize Interactive Leaflet Map centered on Kampala
    const map = L.map('map').setView([0.3476, 32.5825], 12);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16
    }).addTo(map);

    // Layer group to manage map markers cleanly
    const markersLayer = L.layerGroup().addTo(map);

    function loadAndDisplayIncidents() {
        markersLayer.clearLayers();

        // Default sample incidents
        const defaultIncidents = [
            { title: "Road Accident", lat: 0.355, lng: 32.613, info: "High (Ntinda)", time: "2 minutes ago" },
            { title: "Flooding", lat: 0.332, lng: 32.602, info: "Medium (Nakawa)", time: "12 minutes ago" },
            { title: "Fire Outbreak", lat: 0.315, lng: 32.598, info: "Critical (Industrial Area)", time: "25 minutes ago" }
        ];

        // Retrieve user-submitted incidents from localStorage
        const userIncidents = JSON.parse(localStorage.getItem('safeResponseIncidents')) || [];

        // Format user incidents to match display structure
        const formattedUserIncidents = userIncidents.map(inc => ({
            title: inc.category,
            lat: inc.lat,
            lng: inc.lng,
            info: inc.info,
            time: inc.time
        }));

        const allIncidents = [...formattedUserIncidents, ...defaultIncidents];

        // Render markers on the Leaflet map
        allIncidents.forEach(item => {
            const marker = L.marker([item.lat, item.lng])
                .bindPopup(`<h4>${item.title}</h4><p>${item.info}</p><small>${item.time}</small>`);
            markersLayer.addLayer(marker);
        });
    }

    // Initial load call
    loadAndDisplayIncidents();
});
      
