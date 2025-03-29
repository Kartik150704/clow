import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

// Make sure to replace with your actual API key
const API_KEY = 'AIzaSyAnTMzixO68Jym_fc45S69wd2SCUWujSqw';

const UberStyleMapView = () => {
  const webViewRef = useRef(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [distance, setDistance] = useState('');

  // Example routes
  const example1 = {
    origin: { lat: 30.966705751110943, lng: 76.52287334873546 },      // New York City
        destination: { lat: 30.968773264702467, lng: 76.47330499660892 }, // Boston
  };

  const example2 = {
    origin: { lat: 37.7749, lng: -122.4194 },     // San Francisco
    destination: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  };

  const [currentRoute, setCurrentRoute] = useState(example1);

  const switchToExample1 = () => setCurrentRoute(example1);
  const switchToExample2 = () => setCurrentRoute(example2);

  // HTML content with Uber-like styling
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body, html, #map {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        
        <script>
          let map;
          let directionsService;
          let directionsRenderer;
          let currentMarker;
          
          // Black and white map style
          const blackMapStyle = [
            {
              "elementType": "geometry",
              "stylers": [{"color": "#000000"}]
            },
            {
              "elementType": "labels",
              "stylers": [{"visibility": "off"}]
            },
            {
              "featureType": "administrative",
              "stylers": [{"visibility": "off"}]
            },
            {
              "featureType": "poi",
              "stylers": [{"visibility": "off"}]
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{"color": "#222222"}]
            },
            {
              "featureType": "road.arterial",
              "elementType": "geometry",
              "stylers": [{"color": "#373737"}]
            },
            {
              "featureType": "transit",
              "stylers": [{"visibility": "off"}]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{"color": "#111111"}]
            }
          ];
          
          function initMap() {
            const mapOptions = {
              zoom: 10,
              center: { lat: ${currentRoute.origin.lat}, lng: ${currentRoute.origin.lng} },
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              disableDefaultUI: true,
              zoomControl: false,
              styles: blackMapStyle
            };
            
            map = new google.maps.Map(document.getElementById('map'), mapOptions);
            
            directionsService = new google.maps.DirectionsService();
            directionsRenderer = new google.maps.DirectionsRenderer({
              map: map,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#FFFFFF',
                strokeWeight: 3,
                strokeOpacity: 0.85,
                zIndex: 1
              }
            });
            
            // Simple white dot for origin
            const originMarker = new google.maps.Marker({
              position: { lat: ${currentRoute.origin.lat}, lng: ${currentRoute.origin.lng} },
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: '#FFFFFF',
                fillOpacity: 1,
                strokeWeight: 0
              }
            });
            
            // Simple white dot for destination
            const destinationMarker = new google.maps.Marker({
              position: { lat: ${currentRoute.destination.lat}, lng: ${currentRoute.destination.lng} },
              map: map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: '#FFFFFF',
                fillOpacity: 1,
                strokeWeight: 0
              }
            });
            
            calculateAndDisplayRoute();
          }
          
          function calculateAndDisplayRoute() {
            const request = {
              origin: { lat: ${currentRoute.origin.lat}, lng: ${currentRoute.origin.lng} },
              destination: { lat: ${currentRoute.destination.lat}, lng: ${currentRoute.destination.lng} },
              travelMode: google.maps.TravelMode.DRIVING
            };
            
            directionsService.route(request, (response, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(response);
                
                const route = response.routes[0];
                const leg = route.legs[0];
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'routeInfo',
                  duration: leg.duration.text,
                  distance: leg.distance.text
                }));
                
                // Store route for animation
                window.routeCoordinates = google.maps.geometry.encoding.decodePath(route.overview_polyline);
                
                // Just center the map on the route
                const bounds = new google.maps.LatLngBounds();
                window.routeCoordinates.forEach(point => bounds.extend(point));
                map.fitBounds(bounds);
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: 'Directions request failed due to ' + status
                }));
              }
            });
          }
          
          // No animation functions needed - static display only
        </script>
        <script async defer
          src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=geometry,directions&callback=initMap">
        </script>
      </body>
    </html>
  `;

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'routeInfo') {
        setEstimatedTime(data.duration);
        setDistance(data.distance);
      } else if (data.type === 'error') {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          onMessage={onMessage}
        />
      </View>
      
      <View style={styles.infoPanel}>
        <Text style={styles.arrivalText}>Arriving in {estimatedTime || '...'}</Text>
        <Text style={styles.distanceText}>{distance || '...'}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              currentRoute === example1 && styles.activeButton
            ]}
            onPress={switchToExample1}
          >
            <Text style={styles.buttonText}>NY to Boston</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              currentRoute === example2 && styles.activeButton
            ]}
            onPress={switchToExample2}
          >
            <Text style={styles.buttonText}>SF to LA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    padding: 20,
    backgroundColor: 'black',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  arrivalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#DDDDDD',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#222222',
    padding: 14,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#444444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default UberStyleMapView;