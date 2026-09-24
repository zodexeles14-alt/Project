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

// Add dark-mode map layers (Free, no API key needed)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// Add sample incident pins to the map
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
