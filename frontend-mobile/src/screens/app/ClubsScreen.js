import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  Plus,
  X,
  Check,
  UserCheck,
  WifiOff,
  Wifi,
  ChevronRight,
} from "lucide-react-native";
import {
  fetchClubs,
  toggleClubMembership,
  fetchUpcomingEvents,
  toggleEventRsvp,
  postClubEvent,
} from "../../redux/slices/clubSlice";

const { width } = Dimensions.get("window");

export default function ClubsScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { clubs = [], events = [], isLoading = false, submitting = false } = useSelector((state) => state.clubs || {});
  const { profile = {} } = useSelector((state) => state.auth || {});

  // Component UI State
  const [activeTab, setActiveTab] = useState("communities"); // 'communities' | 'events'
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Modals state
  const [eventModalVisible, setEventModalVisible] = useState(false);

  // Event Form state
  const [selectedClubId, setSelectedClubId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVenue, setFormVenue] = useState("");
  const [formDateTime, setFormDateTime] = useState("");

  // Fetch directory data on load
  useEffect(() => {
    dispatch(fetchClubs());
    dispatch(fetchUpcomingEvents());
  }, [dispatch, isSimulatedOffline]);

  // Determine clubs that this student coordinates
  const coordinatedClubs = clubs.filter((club) =>
    club.coordinators.some((coordId) => coordId === profile?._id)
  );

  useEffect(() => {
    if (coordinatedClubs.length > 0 && !selectedClubId) {
      setSelectedClubId(coordinatedClubs[0]._id);
    }
  }, [coordinatedClubs]);

  const handleJoinClub = (clubId) => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "You cannot join communities while offline.");
      return;
    }
    dispatch(toggleClubMembership(clubId))
      .unwrap()
      .then((data) => {
        const joined = data.members.includes(profile?._id);
        Alert.alert("Success", joined ? `Joined "${data.name}"!` : `Left "${data.name}".`);
      })
      .catch((err) => {
        Alert.alert("Failed", err);
      });
  };

  const handleRsvp = (eventId) => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "RSVP features are disabled while offline.");
      return;
    }
    dispatch(toggleEventRsvp(eventId))
      .unwrap()
      .then((data) => {
        const rsvpd = data.rsvps.includes(profile?._id);
        Alert.alert(
          "RSVP Updated",
          rsvpd ? `You RSVP'd for "${data.title}"!` : `Cancelled RSVP for "${data.title}".`
        );
      })
      .catch((err) => {
        Alert.alert("Failed", err);
      });
  };

  const handlePostEvent = () => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "You cannot post events while offline.");
      return;
    }

    if (!selectedClubId || !formTitle.trim() || !formDescription.trim() || !formVenue.trim() || !formDateTime.trim()) {
      Alert.alert("Error", "Please fill in all event details.");
      return;
    }

    // Basic date parsing validation (expects YYYY-MM-DD HH:MM format)
    const parsedDate = new Date(formDateTime.replace(" ", "T"));
    if (isNaN(parsedDate.getTime())) {
      Alert.alert("Error", "Please enter a valid date in YYYY-MM-DD HH:MM format.");
      return;
    }

    dispatch(
      postClubEvent({
        clubId: selectedClubId,
        eventData: {
          title: formTitle,
          description: formDescription,
          venue: formVenue,
          dateTime: parsedDate.toISOString(),
        },
      })
    )
      .unwrap()
      .then(() => {
        setEventModalVisible(false);
        // Reset form
        setFormTitle("");
        setFormDescription("");
        setFormVenue("");
        setFormDateTime("");
        Alert.alert("Success", "Club event posted successfully!");
        setActiveTab("events");
      })
      .catch((err) => {
        Alert.alert("Failed", err);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      {isSimulatedOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#EF4444" />
          <Text style={styles.offlineBannerText}>
            Offline Mode Active (Showing Cached Communities)
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Communities</Text>
          <Text style={styles.headerSubtitle}>Discover clubs and campus events</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            isSimulatedOffline ? styles.toggleBtnActive : styles.toggleBtnInactive,
          ]}
          onPress={() => setIsSimulatedOffline(!isSimulatedOffline)}
        >
          {isSimulatedOffline ? (
            <WifiOff size={16} color="#EF4444" />
          ) : (
            <Wifi size={16} color="#10B981" />
          )}
          <Text
            style={[
              styles.toggleBtnText,
              { color: isSimulatedOffline ? "#EF4444" : "#10B981" },
            ]}
          >
            {isSimulatedOffline ? "Offline" : "Online"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === "communities" && styles.navTabActive]}
          onPress={() => setActiveTab("communities")}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === "communities" && styles.navTabTextActive,
            ]}
          >
            Clubs Directory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, activeTab === "events" && styles.navTabActive]}
          onPress={() => setActiveTab("events")}
        >
          <Text
            style={[styles.navTabText, activeTab === "events" && styles.navTabTextActive]}
          >
            Upcoming Events
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && clubs.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
        </View>
      ) : activeTab === "communities" ? (
        /* Clubs List View */
        <FlatList
          data={clubs}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const isMember = item.members.includes(profile?._id);
            const isCoordinator = item.coordinators.includes(profile?._id);

            return (
              <View style={styles.clubCard}>
                <View style={styles.clubHeader}>
                  <Image source={{ uri: item.logoUrl }} style={styles.clubLogo} />
                  <View style={styles.clubMeta}>
                    <Text style={styles.clubName}>{item.name}</Text>
                    <Text style={styles.clubAdvisor}>
                      Advisor: {item.facultyAdvisor?.userId?.name || "Faculty Advisor"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.clubDesc}>{item.description}</Text>

                <View style={styles.clubFooter}>
                  <View style={styles.memberBadge}>
                    <Users size={12} color="#9CA3AF" />
                    <Text style={styles.memberCountText}>
                      {item.members.length} member{item.members.length !== 1 ? "s" : ""}
                    </Text>
                  </View>

                  {isCoordinator ? (
                    <View style={styles.coordBadge}>
                      <UserCheck size={12} color="#c084fc" />
                      <Text style={styles.coordText}>COORDINATOR</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.joinBtn, isMember && styles.leaveBtn]}
                      onPress={() => handleJoinClub(item._id)}
                    >
                      <Text style={[styles.joinBtnText, isMember && styles.leaveBtnText]}>
                        {isMember ? "LEAVE" : "JOIN CLUB"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      ) : (
        /* Events Feed View */
        <View style={{ flex: 1 }}>
          <FlatList
            data={events}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const dateStr = new Date(item.dateTime).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              const timeStr = new Date(item.dateTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isRsvpd = item.rsvps.includes(profile?._id);

              return (
                <View style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventClub}>{item.clubId?.name?.toUpperCase()}</Text>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                  </View>

                  <Text style={styles.eventDesc}>{item.description}</Text>

                  <View style={styles.eventDetailsBlock}>
                    <View style={styles.eventDetailRow}>
                      <Calendar size={12} color="#c084fc" />
                      <Text style={styles.eventDetailText}>
                        {dateStr} at {timeStr}
                      </Text>
                    </View>
                    <View style={styles.eventDetailRow}>
                      <MapPin size={12} color="#c084fc" />
                      <Text style={styles.eventDetailText}>{item.venue}</Text>
                    </View>
                  </View>

                  <View style={styles.eventFooter}>
                    <Text style={styles.rsvpCountText}>
                      {item.rsvps.length} attending
                    </Text>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, isRsvpd && styles.rsvpBtnActive]}
                      onPress={() => handleRsvp(item._id)}
                    >
                      {isRsvpd ? (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Check size={12} color="#161f2d" style={{ marginRight: 4 }} />
                          <Text style={styles.rsvpBtnActiveText}>RSVP'D</Text>
                        </View>
                      ) : (
                        <Text style={styles.rsvpBtnText}>RSVP</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />

          {/* Floating Create Event Action Button for Coordinators */}
          {coordinatedClubs.length > 0 && (
            <TouchableOpacity
              style={styles.floatingActionBtn}
              onPress={() => setEventModalVisible(true)}
            >
              <Plus size={24} color="#161f2d" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Create Event Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={eventModalVisible}
        onRequestClose={() => setEventModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Host a Club Event</Text>
              <TouchableOpacity onPress={() => setEventModalVisible(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Select Host Club</Text>
              <View style={styles.dropdownContainer}>
                {coordinatedClubs.map((club) => (
                  <TouchableOpacity
                    key={club._id}
                    style={[
                      styles.dropdownItem,
                      selectedClubId === club._id && styles.dropdownItemActive,
                    ]}
                    onPress={() => setSelectedClubId(club._id)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedClubId === club._id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {club.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Event Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Intro to Git Workshop, Tech Talk"
                placeholderTextColor="#6B7280"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.label}>Venue</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Seminar Hall 3, CSE Lab"
                placeholderTextColor="#6B7280"
                value={formVenue}
                onChangeText={setFormVenue}
              />

              <Text style={styles.label}>Date & Time (YYYY-MM-DD HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-07-25 14:00"
                placeholderTextColor="#6B7280"
                value={formDateTime}
                onChangeText={setFormDateTime}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief guidelines, registration procedures, prerequisites..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                value={formDescription}
                onChangeText={setFormDescription}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => setEventModalVisible(false)}
                >
                  <Text style={styles.formCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.formSubmitBtn}
                  onPress={handlePostEvent}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#161f2d" />
                  ) : (
                    <Text style={styles.formSubmitBtnText}>Post Event</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161f2d",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.24)",
  },
  offlineBannerText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  toggleBtnInactive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  navTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2634",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  navTab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  navTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#c084fc",
  },
  navTabText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  navTabTextActive: {
    color: "#c084fc",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 85,
  },
  clubCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 12,
  },
  clubHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  clubLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#161f2d",
  },
  clubMeta: {
    marginLeft: 12,
    flex: 1,
  },
  clubName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  clubAdvisor: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  clubDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  clubFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    paddingTop: 12,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberCountText: {
    color: "#9CA3AF",
    fontSize: 11,
    marginLeft: 6,
  },
  joinBtn: {
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    borderWidth: 1,
    borderColor: "#c084fc",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  leaveBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "#EF4444",
  },
  joinBtnText: {
    color: "#c084fc",
    fontSize: 10,
    fontWeight: "bold",
  },
  leaveBtnText: {
    color: "#EF4444",
  },
  coordBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(192, 132, 252, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coordText: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 6,
  },
  eventCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 12,
  },
  eventHeader: {
    marginBottom: 10,
  },
  eventClub: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  eventTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
  },
  eventDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  eventDetailsBlock: {
    backgroundColor: "#1a212d",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#232e41",
    padding: 10,
    marginBottom: 14,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  eventDetailText: {
    color: "#FFFFFF",
    fontSize: 11,
    marginLeft: 8,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    paddingTop: 12,
  },
  rsvpCountText: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  rsvpBtn: {
    borderWidth: 1,
    borderColor: "#c084fc",
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  rsvpBtnActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  rsvpBtnText: {
    color: "#c084fc",
    fontSize: 10,
    fontWeight: "bold",
  },
  rsvpBtnActiveText: {
    color: "#161f2d",
    fontSize: 10,
    fontWeight: "bold",
  },
  floatingActionBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#c084fc",
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1e2634",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#232e41",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 10,
  },
  label: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 13,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  dropdownContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  dropdownItem: {
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  dropdownItemActive: {
    borderColor: "#c084fc",
    backgroundColor: "rgba(192, 132, 252, 0.12)",
  },
  dropdownItemText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: "#c084fc",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingBottom: 20,
  },
  formCancelBtn: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#232e41",
    alignItems: "center",
  },
  formCancelBtnText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  formSubmitBtn: {
    width: "66%",
    backgroundColor: "#c084fc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formSubmitBtnText: {
    color: "#161f2d",
    fontSize: 13,
    fontWeight: "600",
  },
});
