import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const RideDetailsScreen = ({ ride }) => {
  // Parse destination information from placeto JSON string
  const destination = useMemo(() => {
    try {
      return JSON.parse(ride.placeto);
    } catch (error) {
      console.error('Error parsing destination:', error);
      return {};
    }
  }, [ride.placeto]);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format duration from seconds to minutes
  const formatDuration = (seconds) => {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  // Format distance from meters to kilometers
  const formatDistance = (meters) => {
    const kilometers = (meters / 1000).toFixed(1);
    return `${kilometers} km`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{ride.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Ride ID and Timestamp */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RIDE INFO</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ride ID:</Text>
            <Text style={styles.infoValue}>{ride.rideid.substring(0, 8)}...</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(ride.createdat)}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* Destination Information */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESTINATION</Text>
          <Text style={styles.destinationName}>{destination.name || 'Unknown Location'}</Text>
          <Text style={styles.destinationAddress}>
            {destination.formatted_address || ''}
          </Text>
          
          <View style={styles.tripMetrics}>
            <View style={styles.metric}>
              <View style={styles.iconPlaceholder}>
                <Text style={styles.iconText}>⏱️</Text>
              </View>
              <Text style={styles.metricValue}>
                {destination.duration ? formatDuration(destination.duration) : '--'}
              </Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>
            
            <View style={styles.metric}>
              <View style={styles.iconPlaceholder}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <Text style={styles.metricValue}>
                {destination.distance ? formatDistance(destination.distance) : '--'}
              </Text>
              <Text style={styles.metricLabel}>Distance</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RIDE PARTICIPANTS</Text>
          
          <View style={styles.userCard}>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>👤</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userRole}>Customer</Text>
              <Text style={styles.userId}>{ride.customerid.substring(0, 12)}...</Text>
            </View>
          </View>
          
          <View style={styles.userCard}>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>🚗</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userRole}>Driver</Text>
              <Text style={styles.userId}>{ride.driverid.substring(0, 12)}...</Text>
              <View style={styles.acceptedBadge}>
                <Text style={styles.acceptedText}>Accepted</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* Driver Request Information */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DRIVER REQUESTS</Text>
          <Text style={styles.infoText}>
            This ride was requested to {ride.requestedto.length} drivers.
          </Text>
          
          <View style={styles.driversContainer}>
            {ride.requestedto.map((driverId, index) => (
              <View key={driverId} style={styles.driverItem}>
                <View style={[
                  styles.driverStatusIndicator, 
                  driverId === ride.acceptedby ? styles.acceptedIndicator : styles.pendingIndicator
                ]} />
                <Text style={styles.driverText}>
                  {driverId.substring(0, 8)}...
                  {driverId === ride.acceptedby ? ' (Accepted)' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
        
        {ride.rejectedby && ride.rejectedby.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>REJECTED BY</Text>
              <View style={styles.driversContainer}>
                {ride.rejectedby.map((driverId) => (
                  <View key={driverId} style={styles.driverItem}>
                    <View style={[styles.driverStatusIndicator, styles.rejectedIndicator]} />
                    <Text style={styles.driverText}>{driverId.substring(0, 8)}...</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  infoValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
  },
  destinationName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  destinationAddress: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 16,
  },
  tripMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '48%',
  },
  metricValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userRole: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userId: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  acceptedBadge: {
    backgroundColor: '#444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  acceptedText: {
    color: 'white',
    fontSize: 10,
  },
  infoText: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 12,
  },
  driversContainer: {
    marginTop: 8,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  driverStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pendingIndicator: {
    backgroundColor: '#888',
  },
  acceptedIndicator: {
    backgroundColor: '#FFFFFF',
  },
  rejectedIndicator: {
    backgroundColor: '#555',
  },
  driverText: {
    color: 'white',
    fontSize: 14,
  },
});

export default RideDetailsScreen;