import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import { MapPin, Navigation, Users, Shield, Clock, Compass } from "lucide-react-native";
import {
  fetchRoutes,
  fetchBusLocation,
  updateLiveLocation,
} from "../../redux/slices/busSlice";
import { SOCKET_URL } from "../../utils/api";

const { width, height } = Dimensions.get("window");

export default function BusTrackingScreen() {
  const dispatch = useDispatch();
  const { routes, activeLocations, isLoading, error } = useSelector(
    (state) => state.bus,
  );
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  // 1. Fetch routes on mount
  useEffect(() => {
    dispatch(fetchRoutes());
  }, [dispatch]);

  // 2. Resolve default route and fetch its current location
  useEffect(() => {
    if (routes && routes.length > 0 && !selectedRouteId) {
      const defaultId = routes[0]._id;
      setSelectedRouteId(defaultId);
      dispatch(fetchBusLocation(defaultId));
    }
  }, [routes, selectedRouteId, dispatch]);

  // 3. Establish Socket connection for real-time bus tracking
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("bus:update", (data) => {
      console.log("Received live bus coordinate ping (Web):", data);
      dispatch(updateLiveLocation(data));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const activeRoute = routes.find((r) => r._id === selectedRouteId);
  const busLocation = selectedRouteId ? activeLocations[selectedRouteId] : null;

  const handleRouteChange = (routeId) => {
    setSelectedRouteId(routeId);
    dispatch(fetchBusLocation(routeId));
  };

  if (isLoading && routes.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#c084fc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mock Map Container for Web */}
      <View style={styles.mapMock}>
        <Compass size={48} color="#1e2634" style={styles.compassBg} />
        <View style={styles.mapGridLineH} />
        <View style={styles.mapGridLineV} />
        
        <View style={styles.mockMapLabelContainer}>
          <MapPin size={18} color="#c084fc" />
          <Text style={styles.mockMapTitle}>Interactive Web Map Sandbox</Text>
          <Text style={styles.mockMapSubtitle}>
            Native map views are mocked on web. Route chips, socket updates, and telemetry remain fully functional.
          </Text>
        </View>

        {activeRoute && (
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>Route Timeline: {activeRoute.routeName}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineScroll}
            >
              <View style={styles.timelineTrackContainer}>
                {/* Horizontal progress line */}
                <View style={styles.timelineLine} />
                
                {/* Stops along the track */}
                {activeRoute.stops.map((stop, idx) => (
                  <View key={stop._id || idx} style={styles.timelineNode}>
                    <View style={styles.stopBullet} />
                    <Text style={styles.timelineStopName} numberOfLines={1}>{stop.name}</Text>
                    <Text style={styles.timelineStopCoords}>
                      {stop.latitude.toFixed(3)}, {stop.longitude.toFixed(3)}
                    </Text>
                  </View>
                ))}

                {/* Live Bus marker icon overlay on the line */}
                {busLocation && (
                  <View style={[styles.timelineBusMarker, { left: `${Math.min(85, Math.max(15, activeRoute.stops.length * 10))}%` }]}>
                    <View style={styles.timelineBusGlow} />
                    <View style={styles.timelineBusCore}>
                      <Navigation size={12} color="#FFFFFF" style={styles.busIcon} />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Floating Header */}
      <View style={styles.floatingHeader}>
        <Text style={styles.headerTitle}>Live Bus Tracking</Text>
        <Text style={styles.headerSubtitle}>
          Real-time GPS coordinate feeds (Web Sandbox)
        </Text>
      </View>

      {/* Floating Card for Route Selector */}
      <View style={styles.floatingCard}>
        {/* Horizontal routes carousel selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.routesScroll}
          contentContainerStyle={styles.routesScrollContent}
        >
          {routes.map((route) => {
            const isSelected = selectedRouteId === route._id;
            return (
              <TouchableOpacity
                key={route._id}
                style={[styles.routeChip, isSelected && styles.routeChipActive]}
                onPress={() => handleRouteChange(route._id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.routeChipCode,
                    isSelected && styles.routeChipCodeActive,
                  ]}
                >
                  {route.routeCode}
                </Text>
                <Text
                  style={[
                    styles.routeChipName,
                    isSelected && styles.routeChipNameActive,
                  ]}
                >
                  {route.routeName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bus Info Details */}
        {activeRoute && (
          <View style={styles.busDetails}>
            {busLocation ? (
              <>
                <View style={styles.detailsRow}>
                  <View style={styles.statBox}>
                    <Users size={16} color="#c084fc" />
                    <Text style={styles.statText}>
                      {busLocation.occupancy || 0} Boarded
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Clock size={16} color="#10B981" />
                    <Text style={styles.statText}>
                      Speed: {busLocation.speed || 0} km/h
                    </Text>
                  </View>
                </View>
                <View style={styles.coordsRow}>
                  <Text style={styles.coordsText}>
                    Active Coordinates: Lat {busLocation.latitude.toFixed(5)} · Lon {busLocation.longitude.toFixed(5)}
                  </Text>
                </View>
                <Text style={styles.driverText}>
                  Driver: {activeRoute.driverId?.name || "Staff Driver"}
                </Text>
                <View style={styles.liveBadge}>
                  <View style={styles.pulsePoint} />
                  <Text style={styles.liveText}>LIVE GPS TRACKING</Text>
                </View>
              </>
            ) : (
              <View style={styles.offlineBox}>
                <Shield size={20} color="#9CA3AF" />
                <Text style={styles.offlineText}>
                  Bus is currently offline.
                </Text>
                <Text style={styles.offlineSubText}>
                  Coordinates update when driver begins trip.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  mapMock: {
    flex: 1,
    backgroundColor: "#0b0f19",
    justifyContent: "flex-start",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    paddingTop: 120,
  },
  compassBg: {
    position: "absolute",
    opacity: 0.05,
    transform: [{ scale: 4 }],
    top: "30%",
  },
  mapGridLineH: {
    position: "absolute",
    height: 1,
    left: 0,
    right: 0,
    backgroundColor: "#1e2634",
    opacity: 0.4,
    top: "40%",
  },
  mapGridLineV: {
    position: "absolute",
    width: 1,
    top: 0,
    bottom: 0,
    backgroundColor: "#1e2634",
    opacity: 0.4,
  },
  mockMapLabelContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    zIndex: 1,
    marginBottom: 20,
  },
  mockMapTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 10,
    textAlign: "center",
  },
  mockMapSubtitle: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  timelineContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
    zIndex: 2,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c084fc",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  timelineScroll: {
    alignItems: "center",
    paddingVertical: 10,
  },
  timelineTrackContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    height: 80,
  },
  timelineLine: {
    position: "absolute",
    height: 4,
    left: 30,
    right: 30,
    backgroundColor: "#c084fc",
    opacity: 0.4,
    borderRadius: 2,
    top: 15,
  },
  timelineNode: {
    alignItems: "center",
    width: 120,
    marginHorizontal: 5,
  },
  stopBullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#c084fc",
    marginBottom: 8,
    zIndex: 2,
  },
  timelineStopName: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    width: 110,
  },
  timelineStopCoords: {
    color: "#6B7280",
    fontSize: 9,
    marginTop: 2,
  },
  timelineBusMarker: {
    position: "absolute",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    top: 9, // Center vertically on the line (which is at top 15, height 12 bullet/line)
    transform: [{ translateX: -12 }], // Center marker relative to left position
  },
  timelineBusGlow: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10B981",
    opacity: 0.3,
  },
  timelineBusCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  busIcon: {
    transform: [{ rotate: "45deg" }],
  },
  floatingHeader: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(22, 31, 45, 0.85)",
    borderWidth: 1,
    borderColor: "#1e2634",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  floatingCard: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderColor: "#1e2634",
    borderRadius: 24,
    paddingBottom: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 3,
  },
  routesScroll: {
    borderBottomWidth: 1,
    borderBottomColor: "#1e2634",
    paddingVertical: 14,
  },
  routesScrollContent: {
    paddingHorizontal: 16,
  },
  routeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e2634",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  routeChipActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  routeChipCode: {
    fontSize: 11,
    fontWeight: "800",
    color: "#c084fc",
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  routeChipCodeActive: {
    color: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  routeChipName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  routeChipNameActive: {
    color: "#FFFFFF",
  },
  busDetails: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  coordsRow: {
    marginBottom: 10,
  },
  coordsText: {
    fontSize: 11,
    color: "#6B7280",
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    color: "#F3F4F6",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  driverText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pulsePoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#10B981",
  },
  offlineBox: {
    alignItems: "center",
    paddingVertical: 8,
  },
  offlineText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  offlineSubText: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 4,
  },
});
