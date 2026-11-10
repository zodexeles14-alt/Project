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
  function fetchLocation() {
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
        gpsStatus.textContent = `Location Captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
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
  getGpsBtn.addEventListener('click', fetchLocation);

  // 3. Submit Report with GPS Data
  submitBtn.addEventListener('click', () => {
    if (!userCoordinates) {
      alert('Please click "Get Current Location" before submitting so responders can locate you.');
      return;
    }

    alert(`Emergency Reported Successfully!\n\nType: ${selectedEmergency}\nLatitude: ${userCoordinates.latitude}\nLongitude: ${userCoordinates.longitude}`);
  });
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.log('Service Worker registration failed:', err));
  });
}
// Initialize interactive map centered on Kampala
const map = L.map('map').setView([0.3476, 32.5825], 12);

// map
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  maxZoom: 16
}).addTo(map);

const incidents = [
  { title: "Road Accident", lat: 0.355, lng: 32.610, info: "High (Ntinda)" },
  { title: "Flooding", lat: 0.332, lng: 32.602, info: "Medium (Nakawa)" },
  { title: "Fire Outbreak", lat: 0.315, lng: 32.590, info: "Critical (Industrial Area)" }
];

incidents.forEach(item => {
  L.marker([item.lat, item.lng])
    .addTo(map)
    .bindPopup(`<h4>${item.title}</h4><p>${item.info}</p>`);
});
// Initialize Leaflet Map (assuming 'map' is your container id)
const map = L.map('map').setView([0.3476, 32.5825], 13); // Default view: Kampala, Uganda

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© SafeResponse Uganda'
}).layer = true.addTo(map);

// Layer group to hold dynamic incident markers so we can manage them easily
const markersLayer = L.layerGroup().addTo(map);

let currentLat = null;
let currentLng = null;

// 1. Handle Geolocation Capture
document.getElementById('getLocationBtn').addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        document.getElementById('latitude').value = currentLat;
        document.getElementById('longitude').value = currentLng;
        document.getElementById('locationStatus').innerText = `Lat: ${currentLat.toFixed(4)}, Lng: ${currentLng.toFixed(4)}`;
      },
      (error) => {
        alert("Error getting location: " + error.message);
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// 2. Load existing incidents on page load
document.addEventListener('DOMContentLoaded', loadIncidents);

function loadIncidents() {
  markersLayer.clearLayers();
  const incidentsList = document.getElementById('incidentsContainer');
  incidentsList.innerHTML = '';

  const incidents = JSON.parse(localStorage.getItem('safeResponseIncidents')) || [];

  incidents.forEach((incident) => {
    // A. Add Marker to Leaflet Map
    if (incident.lat && incident.lng) {
      const marker = L.marker([incident.lat, incident.lng]).bindPopup(`
        <strong>${incident.category}</strong><br>
        Status: <span style="color:red;">Active</span><br>
        <small>${incident.time}</small>
      `);
      markersLayer.addLayer(marker);
    }

    // B. Render Card in Incidents Section
    const card = document.createElement('div');
    card.className = 'incident-card';
    card.style.cssText = "background: #1e1e1e; color: #fff; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #ff4d4d;";
    
    card.innerHTML = `
      <h4>🚨 ${incident.category} Emergency</h4>
      <p>Location: ${incident.lat ? `${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}` : 'Coordinates unlisted'}</p>
      <small style="color: #aaa;">Reported at: ${incident.time}</small>
    `;
    incidentsList.prepend(card); // Add newest to top
  });
}

// 3. Handle Form Submission
document.getElementById('emergencyReportForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const category = document.getElementById('selectedCategory').value;
  
  if (!currentLat || !currentLng) {
    alert("Please capture your location first before reporting!");
    return;
  }

  const newIncident = {
    category: category,
    lat: currentLat,
    lng: currentLng,
    time: new Date().toLocaleString()
  };

  // Save to LocalStorage
  const incidents = JSON.parse(localStorage.getItem('safeResponseIncidents')) || [];
  incidents.push(newIncident);
  localStorage.setItem('safeResponseIncidents', JSON.stringify(incidents));

  // Refresh map markers and incident feed
  loadIncidents();

  // Optionally pan map to the newly reported incident location
  map.setView([currentLat, currentLng], 15);

  alert("Emergency reported successfully! Broadcasted to live map and feed.");
  this.reset();
  document.getElementById('locationStatus').innerText = "Location not captured yet.";
  currentLat = null;
  currentLng = null;
});
