import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import io from "socket.io-client";
import { MapPin, Navigation, Users, Shield, Clock } from "lucide-react-native";
import {
  fetchRoutes,
  fetchBusLocation,
  updateLiveLocation,
} from "../../redux/slices/busSlice";
import { SOCKET_URL } from "../../utils/api";

const { width, height } = Dimensions.get("window");

// Premium Dark Theme styling for Google Maps / Apple Maps
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0F172A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748B" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0F172A" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748B" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0F172A" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748B" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#020617" }],
  },
];

export default function BusTrackingScreen() {
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();

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
      console.log("Received live bus coordinate ping:", data);
      dispatch(updateLiveLocation(data));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  // 4. Center map view when active route changes or bus location updates
  const activeRoute = routes.find((r) => r._id === selectedRouteId);
  const busLocation = selectedRouteId ? activeLocations[selectedRouteId] : null;

  useEffect(() => {
    if (!activeRoute || activeRoute.stops.length === 0) return;

    const coordinates = activeRoute.stops.map((s) => ({
      latitude: s.latitude,
      longitude: s.longitude,
    }));

    if (busLocation) {
      coordinates.push({
        latitude: busLocation.latitude,
        longitude: busLocation.longitude,
      });
    }

    // Adjust camera to fit all coordinates nicely
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
        animated: true,
      });
    }
  }, [selectedRouteId, busLocation, activeRoute]);

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

  // Fallback default region (Campus coordinates placeholder)
  const defaultRegion = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      {/* Map Layout */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={defaultRegion}
        customMapStyle={darkMapStyle}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {activeRoute && (
          <>
            {/* Draw Path Polyline linking all stops */}
            <Polyline
              coordinates={activeRoute.stops.map((stop) => ({
                latitude: stop.latitude,
                longitude: stop.longitude,
              }))}
              strokeColor="#c084fc"
              strokeWidth={4}
              lineDashPattern={[0]}
            />

            {/* Render Stops markers */}
            {activeRoute.stops.map((stop, idx) => (
              <Marker
                key={stop._id || idx}
                coordinate={{
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                }}
                title={stop.name}
                description="Bus Stop"
              >
                <View style={styles.stopMarker}>
                  <View style={styles.stopCore} />
                </View>
              </Marker>
            ))}

            {/* Render Live Bus marker */}
            {busLocation && (
              <Marker
                coordinate={{
                  latitude: busLocation.latitude,
                  longitude: busLocation.longitude,
                }}
                title={`${activeRoute.routeCode} Bus`}
                description={`Occupancy: ${busLocation.occupancy} seats`}
              >
                <View style={styles.busMarkerWrapper}>
                  <View style={styles.busMarkerGlow} />
                  <View style={styles.busMarker}>
                    <Navigation
                      size={18}
                      color="#FFFFFF"
                      style={styles.busIcon}
                    />
                  </View>
                </View>
              </Marker>
            )}
          </>
        )}
      </MapView>

      {/* Floating Header */}
      <View
        style={[
          styles.floatingHeader,
          { top: insets.top > 0 ? insets.top + 10 : 20 },
        ]}
      >
        <Text style={styles.headerTitle}>Live Bus Tracking</Text>
        <Text style={styles.headerSubtitle}>
          Real-time GPS coordinate feeds
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
  map: {
    width: width,
    height: height,
  },
  floatingHeader: {
    position: "absolute",
    top: 50,
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
    marginBottom: 10,
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
  stopMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#c084fc",
    justifyContent: "center",
    alignItems: "center",
  },
  stopCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#c084fc",
  },
  busMarkerWrapper: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  busMarkerGlow: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#10B981",
    opacity: 0.3,
  },
  busMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  busIcon: {
    transform: [{ rotate: "45deg" }],
  },
});
