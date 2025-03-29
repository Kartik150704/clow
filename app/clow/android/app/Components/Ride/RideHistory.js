import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { FetchAllRide } from './api/rides';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RideHistory = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'starttime', direction: 'desc' });
  const [expandedRide, setExpandedRide] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState('cards');
  const [showFilterOptions, setShowFilterOptions] = useState(false);

  const fetchRide = async () => {
    setLoading(true);
    try {
      // Hardcoded ID as requested
      let id = await AsyncStorage.getItem('id');

      let response = await FetchAllRide(id);

      if (response && Array.isArray(response)) {
        // Filter out any potentially null or invalid entries
        const validRides = response.filter(ride => ride && typeof ride === 'object');

        // Sort rides by most recent first, with null check
        const sortedRides = validRides.sort((a, b) => {
          if (!a.starttime) return 1;
          if (!b.starttime) return -1;
          return new Date(parseDate(b.starttime)) - new Date(parseDate(a.starttime));
        });

        setRides(sortedRides);
      } else {
        // For demo purposes, let's add some sample data
        setRides([
          {
            id: "ride123456",
            placeto: "Central Park",
            status: "completed",
            starttime: "2023-09-15T14:30:00Z",
            endtime: "2023-09-15T15:15:00Z",
            initialmeterreading: "1245.5",
            finalmeterreading: "1258.2",
            paymentdata: {
              amount: "350",
              paymentMethod: "card",
              status: "paid"
            }
          },
          {
            id: "ride789012",
            placeto: "Downtown Mall",
            status: "canceled",
            starttime: "2023-09-14T09:15:00Z",
            endtime: null,
            initialmeterreading: "1240.0",
            finalmeterreading: null,
            paymentdata: {
              amount: "0",
              paymentMethod: "none",
              status: "cancelled"
            }
          },
          {
            id: "ride345678",
            placeto: "Airport Terminal 2",
            status: "completed",
            starttime: "2023-09-10T05:20:00Z",
            endtime: "2023-09-10T06:45:00Z",
            initialmeterreading: "1100.5",
            finalmeterreading: "1145.8",
            paymentdata: {
              amount: "980",
              paymentMethod: "cash",
              status: "paid"
            }
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch rides:", error);
      setError("Failed to load ride history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRide();
  }, []);

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Safe date parsing function
  const parseDate = (dateString) => {
    if (!dateString) return null;

    try {
      // Try standard ISO format first
      const date = new Date(dateString);

      // Check if date is valid
      if (!isNaN(date.getTime())) {
        return date;
      }

      return null;
    } catch (error) {
      console.error("Error parsing date:", error, dateString);
      return null;
    }
  };

  // Format date for display with proper error handling
  const formatDate = (dateString, formatStyle = 'full') => {
    if (!dateString) return "N/A";

    try {
      const date = parseDate(dateString);
      if (!date) return "Invalid date";

      if (formatStyle === 'dateOnly') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else if (formatStyle === 'timeOnly') {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
      } else {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  // Calculate ride duration in minutes
  const calculateDuration = (start, end) => {
    if (!start || !end) return "N/A";

    try {
      const startTime = parseDate(start);
      const endTime = parseDate(end);

      // Check for invalid dates
      if (!startTime || !endTime) {
        return "N/A";
      }

      const durationMs = endTime - startTime;
      const minutes = Math.round(durationMs / (1000 * 60));

      if (minutes < 0) return "N/A";

      if (minutes < 60) {
        return `${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
      }
    } catch (error) {
      console.error("Error calculating duration:", error);
      return "N/A";
    }
  };

  // Calculate distance with proper handling of missing/invalid data
  const calculateDistance = (initial, final) => {
    if (initial === undefined || final === undefined ||
      isNaN(Number(initial)) || isNaN(Number(final))) {
      return "N/A";
    }

    const distance = Number(final) - Number(initial);
    return `${distance >= 0 ? distance.toFixed(1) : 0} km`;
  };

  // Filter and sort rides
  const filteredAndSortedRides = React.useMemo(() => {
    if (!rides || !Array.isArray(rides)) return [];

    let filteredRides = [...rides];

    // Apply status filter
    if (filterStatus !== 'all') {
      filteredRides = filteredRides.filter(ride => ride?.status === filterStatus);
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredRides = filteredRides.filter(ride =>
        (ride?.placeto?.toLowerCase().includes(searchLower)) ||
        (ride?.id?.includes(searchTerm))
      );
    }

    // Apply sort
    filteredRides.sort((a, b) => {
      let aValue = a?.[sortConfig.key];
      let bValue = b?.[sortConfig.key];

      // Handle null/undefined values in sort
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Special handling for nested objects
      if (sortConfig.key === 'paymentdata.amount') {
        aValue = a?.paymentdata?.amount ?? 0;
        bValue = b?.paymentdata?.amount ?? 0;
      }

      // Special handling for dates
      if (sortConfig.key === 'starttime' || sortConfig.key === 'endtime') {
        aValue = parseDate(aValue) || new Date(0);
        bValue = parseDate(bValue) || new Date(0);

        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // Handle string comparison
      if (typeof aValue === 'string') {
        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }

      // Convert to numbers for comparison if possible
      if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Handle numeric comparison
      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filteredRides;
  }, [rides, searchTerm, sortConfig, filterStatus]);

  // Toggle expanded details for a ride
  const toggleExpandRide = (id) => {
    setExpandedRide(expandedRide === id ? null : id);
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading your rides...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ride History</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRide}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render status badge component
  const StatusBadge = ({ status }) => {
    if (!status) {
      return (
        <View style={styles.badgeOutline}>
          <Text style={styles.badgeText}>Unknown</Text>
        </View>
      );
    }

    let badgeStyle = styles.badgeDefault;

    switch (status.toLowerCase()) {
      case 'completed':
        badgeStyle = styles.badgeSuccess;
        break;
      case 'canceled':
        badgeStyle = styles.badgeDestructive;
        break;
      default:
        badgeStyle = styles.badgeDefault;
    }

    return (
      <View style={badgeStyle}>
        <Text style={styles.badgeText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
      </View>
    );
  };

  // Render a single ride card
  const renderRideCard = ({ item: ride }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{ride.placeto || "Unknown Destination"}</Text>
          <Text style={styles.cardDescription}>ID: {ride.id ? ride.id.slice(-6) : "—"}</Text>
        </View>
        <StatusBadge status={ride.status} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardGrid}>
          <View style={styles.cardGridItem}>
            <Text style={styles.cardLabel}>Date & Time</Text>
            <Text style={styles.cardText}>{formatDate(ride.starttime, 'dateOnly')}</Text>
            <Text style={styles.cardText}>{formatDate(ride.starttime, 'timeOnly')}</Text>
          </View>

          <View style={styles.cardGridItem}>
            <Text style={styles.cardLabel}>Payment</Text>
            <Text style={styles.cardText}>₹{ride.paymentdata?.amount || "—"}</Text>
            <Text style={styles.cardSubtext}>
              {ride.paymentdata?.paymentMethod || "N/A"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => toggleExpandRide(ride.id)}
        >
          <Text style={styles.detailsButtonText}>
            {expandedRide === ride.id ? "Hide Details" : "Show Details"}
          </Text>
        </TouchableOpacity>

        {expandedRide === ride.id && (
          <View style={styles.collapsibleContent}>
            <View style={styles.separator} />
            <View style={styles.cardGrid}>
              <View style={styles.cardGridItem}>
                <Text style={styles.cardLabel}>Duration</Text>
                <Text style={styles.cardText}>
                  {calculateDuration(ride?.starttime, ride?.endtime)}
                </Text>
              </View>

              <View style={styles.cardGridItem}>
                <Text style={styles.cardLabel}>Distance</Text>
                <Text style={styles.cardText}>
                  {calculateDistance(ride?.initialmeterreading, ride?.finalmeterreading)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // Render ride in list view - simplified with fewer columns
  const renderRideListItem = ({ item: ride }) => (
    <TouchableOpacity
      style={[styles.listItem, expandedRide === ride.id && styles.listItemExpanded]}
      onPress={() => toggleExpandRide(ride.id)}
    >
      <View style={styles.listItemRow}>
        <View style={styles.listItemCell}>
          <Text style={styles.listItemText} numberOfLines={1}>{ride?.placeto || "N/A"}</Text>
        </View>
        <View style={styles.listItemCell}>
          <Text style={styles.listItemText}>{formatDate(ride?.starttime, 'dateOnly')}</Text>
        </View>
        <View style={styles.listItemCell}>
          <StatusBadge status={ride?.status} />
        </View>
      </View>

      {expandedRide === ride.id && (
        <View style={styles.listItemDetails}>
          <View style={styles.cardGrid}>
            <View style={styles.cardGridItem}>
              <Text style={styles.cardLabel}>Time</Text>
              <Text style={styles.cardText}>
                {formatDate(ride?.starttime, 'timeOnly')}
              </Text>
              <Text style={styles.cardSubtext}>
                Duration: {calculateDuration(ride?.starttime, ride?.endtime)}
              </Text>
            </View>

            <View style={styles.cardGridItem}>
              <Text style={styles.cardLabel}>Payment</Text>
              <Text style={styles.cardText}>
                ₹{ride?.paymentdata?.amount ?? "N/A"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // FIX: Use appropriate container for tabular data that won't cause nesting issues
  // The main issue is in the TableView component
  // Replace the current TableView with this:

  const TableView = () => (
    <FlatList
      data={filteredAndSortedRides}
      renderItem={({ item: ride }) => (
        <TouchableOpacity
          key={ride.id || `ride-${Math.random()}`}
          style={[styles.tableRow, expandedRide === ride.id && styles.tableRowExpanded]}
          onPress={() => toggleExpandRide(ride.id)}
        >
          <View style={styles.tableCell}>
            <Text style={styles.tableCellText} numberOfLines={1}>{ride?.placeto || "N/A"}</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={styles.tableCellText}>{formatDate(ride?.starttime, 'dateOnly')}</Text>
          </View>
          <View style={styles.tableCell}>
            <StatusBadge status={ride?.status} />
          </View>

          {expandedRide === ride.id && (
            <View style={styles.tableRowDetails}>
              <View style={styles.cardGrid}>
                <View style={styles.cardGridItem}>
                  <Text style={styles.cardLabel}>Time</Text>
                  <Text style={styles.cardText}>
                    {formatDate(ride?.starttime, 'timeOnly')}
                  </Text>
                  <Text style={styles.cardSubtext}>
                    Duration: {calculateDuration(ride?.starttime, ride?.endtime)}
                  </Text>
                </View>

                <View style={styles.cardGridItem}>
                  <Text style={styles.cardLabel}>Payment</Text>
                  <Text style={styles.cardText}>
                    ₹{ride?.paymentdata?.amount ?? "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id || `ride-${Math.random()}`}
      ListHeaderComponent={() => (
        <View style={styles.tableHeader}>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>Destination</Text>
          </View>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>Date</Text>
          </View>
          <View style={styles.tableHeaderCell}>
            <Text style={styles.tableHeaderText}>Status</Text>
          </View>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.subtitle}>View all your past and upcoming rides</Text>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by destination..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterOptions(!showFilterOptions)}
          >
            <Text style={styles.filterButtonText}>
              {filterStatus === 'all' ? 'All' : filterStatus}
            </Text>
          </TouchableOpacity>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleButton, view === 'table' && styles.viewToggleButtonActive]}
              onPress={() => setView('table')}
            >
              <Text style={styles.viewToggleText}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleButton, view === 'cards' && styles.viewToggleButtonActive]}
              onPress={() => setView('cards')}
            >
              <Text style={styles.viewToggleText}>Cards</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showFilterOptions && (
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setFilterStatus('all');
                setShowFilterOptions(false);
              }}
            >
              <Text style={styles.filterOptionText}>All Statuses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setFilterStatus('completed');
                setShowFilterOptions(false);
              }}
            >
              <Text style={styles.filterOptionText}>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setFilterStatus('canceled');
                setShowFilterOptions(false);
              }}
            >
              <Text style={styles.filterOptionText}>Canceled</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {filteredAndSortedRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No rides found</Text>
          <Text style={styles.emptyText}>
            {searchTerm || filterStatus !== 'all'
              ? "Try adjusting your search or filters"
              : "You haven't taken any rides yet"}
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {view === 'table' ?
            <TableView /> :
            <FlatList
              data={filteredAndSortedRides}
              renderItem={renderRideCard}
              keyExtractor={(item) => item.id || `ride-card-${Math.random()}`}
              showsVerticalScrollIndicator={false}
            />
          }
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Showing {filteredAndSortedRides.length} of {rides.length} rides
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  controlsContainer: {
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    height: '100%',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterButtonText: {
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444444',
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#222222',
  },
  viewToggleButtonActive: {
    backgroundColor: '#444444',
  },
  viewToggleText: {
    color: '#FFFFFF',
  },
  filterOptions: {
    backgroundColor: '#222222',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterOptionText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Card Styles
  card: {
    backgroundColor: '#111111',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cardGridItem: {
    width: '50%',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 12,
    color: '#999999',
  },
  detailsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#999999',
  },
  separator: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 8,
  },
  collapsibleContent: {
    marginTop: 4,
  },
  // Improved Table Styles
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#222222',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableRowExpanded: {
    backgroundColor: '#222222',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  tableCellText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  tableRowDetails: {
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  // Badge Styles (Black and white only)
  badgeSuccess: {
    backgroundColor: '#444444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeDefault: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeDestructive: {
    backgroundColor: '#222222',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeOutline: {
    borderWidth: 1,
    borderColor: '#555555',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  // Footer Styles
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  }
});

export default RideHistory;