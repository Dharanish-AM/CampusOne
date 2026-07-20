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
  Linking,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  GraduationCap,
  Search,
  Briefcase,
  ExternalLink,
  X,
  Check,
  Send,
  WifiOff,
  Wifi,
  ChevronRight,
  TrendingUp,
  UserCheck,
} from "lucide-react-native";
import {
  fetchAlumniDirectory,
  submitMentorshipRequest,
  fetchMentorshipRequests,
} from "../../redux/slices/alumniSlice";

const { width } = Dimensions.get("window");

export default function AlumniScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { directory = [], requests = [], isLoading = false, submitting = false } = useSelector((state) => state.alumni || {});
  const { profile = {} } = useSelector((state) => state.auth || {});

  // Component UI State
  const [activeTab, setActiveTab] = useState("directory"); // 'directory' | 'requests'
  const [searchQuery, setSearchQuery] = useState("");
  const [showMentorsOnly, setShowMentorsOnly] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Modals state
  const [mentorshipModalVisible, setMentorshipModalVisible] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [requestNotes, setRequestNotes] = useState("");

  // Fetch directory data on load/filter
  useEffect(() => {
    dispatch(
      fetchAlumniDirectory({
        q: searchQuery,
        isMentor: showMentorsOnly ? "true" : undefined,
      })
    );
  }, [dispatch, searchQuery, showMentorsOnly, isSimulatedOffline]);

  // Fetch requests on tab change
  useEffect(() => {
    if (activeTab === "requests") {
      dispatch(fetchMentorshipRequests());
    }
  }, [dispatch, activeTab]);

  const handleSubmitRequest = () => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "Mentorship requests are disabled while offline.");
      return;
    }

    if (!selectedAlumni) return;

    dispatch(
      submitMentorshipRequest({
        alumniId: selectedAlumni._id,
        notes: requestNotes,
      })
    )
      .unwrap()
      .then((data) => {
        setMentorshipModalVisible(false);
        setRequestNotes("");
        Alert.alert("Request Submitted", "Your mentorship request has been sent successfully!");
        setActiveTab("requests");
      })
      .catch((err) => {
        Alert.alert("Request Failed", err);
      });
  };

  const handleOpenMentorshipModal = (alumni) => {
    // Check if request already exists for this alumni
    const alreadyRequested = Array.isArray(requests) && requests.some(
      (req) => req.alumniId?._id === alumni._id || req.alumniId === alumni._id
    );

    if (alreadyRequested) {
      Alert.alert("Already Requested", "You have already submitted a mentorship request to this alumnus.");
      return;
    }

    setSelectedAlumni(alumni);
    setMentorshipModalVisible(true);
  };

  const handleOpenLinkedIn = (url) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => {
      Alert.alert("Could not open page", "Invalid URL or LinkedIn application is not installed.");
    });
  };

  const getRequestStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B"; // Orange
      case "approved":
        return "#10B981"; // Green
      case "rejected":
        return "#EF4444"; // Red
      default:
        return "#94A3B8";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      {isSimulatedOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#EF4444" />
          <Text style={styles.offlineBannerText}>
            Offline Mode Active (Showing Cached Directory)
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Alumni Network</Text>
          <Text style={styles.headerSubtitle}>Connect with graduates & mentors</Text>
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
          style={[styles.navTab, activeTab === "directory" && styles.navTabActive]}
          onPress={() => setActiveTab("directory")}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === "directory" && styles.navTabTextActive,
            ]}
          >
            Alumni Directory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, activeTab === "requests" && styles.navTabActive]}
          onPress={() => setActiveTab("requests")}
        >
          <Text
            style={[styles.navTabText, activeTab === "requests" && styles.navTabTextActive]}
          >
            Mentorship Requests
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "directory" ? (
        /* Directory List View */
        <View style={{ flex: 1 }}>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, company, or position..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Mentors Filter Toggle */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Show Mentors Only</Text>
            <TouchableOpacity
              style={[
                styles.mentorFilterBtn,
                showMentorsOnly ? styles.mentorFilterActive : styles.mentorFilterInactive,
              ]}
              onPress={() => setShowMentorsOnly(!showMentorsOnly)}
            >
              <Text
                style={[
                  styles.mentorFilterText,
                  { color: showMentorsOnly ? "#161f2d" : "#c084fc" },
                ]}
              >
                {showMentorsOnly ? "ENABLED" : "DISABLED"}
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading && (!directory || directory.length === 0) ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#c084fc" />
            </View>
          ) : (
            <FlatList
              data={directory || []}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <View style={styles.alumniCard}>
                  <View style={styles.alumniHeader}>
                    <View style={styles.alumniAvatar}>
                      <GraduationCap size={24} color="#161f2d" />
                    </View>
                    <View style={styles.alumniMeta}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={styles.alumniName}>
                          {item.userId?.name || "Alumni Graduate"}
                        </Text>
                        {item.isMentor && (
                          <View style={styles.mentorBadge}>
                            <Text style={styles.mentorBadgeText}>MENTOR</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.alumniBatch}>
                        Class of {item.graduationYear} • {item.department}
                      </Text>
                    </View>
                  </View>

                  {item.company ? (
                    <View style={styles.careerRow}>
                      <Briefcase size={12} color="#9CA3AF" style={{ marginRight: 6 }} />
                      <Text style={styles.careerText}>
                        {item.position} at {item.company}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.alumniFooter}>
                    {item.linkedInUrl ? (
                      <TouchableOpacity
                        style={styles.linkedinBtn}
                        onPress={() => handleOpenLinkedIn(item.linkedInUrl)}
                      >
                        <ExternalLink size={14} color="#0077B5" style={{ marginRight: 6 }} />
                        <Text style={styles.linkedinText}>LinkedIn</Text>
                      </TouchableOpacity>
                    ) : (
                      <View />
                    )}

                    {item.isMentor && (
                      <TouchableOpacity
                        style={styles.mentorshipBtn}
                        onPress={() => handleOpenMentorshipModal(item)}
                      >
                        <UserCheck size={12} color="#161f2d" style={{ marginRight: 6 }} />
                        <Text style={styles.mentorshipBtnText}>REQUEST MENTOR</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        /* Requests History View */
        <FlatList
          data={requests || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Just now";
            const statusColor = getRequestStatusColor(item.status);

            return (
              <View style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View>
                    <Text style={styles.requestAlumniName}>
                      {item.alumniId?.userId?.name || "Alumni Mentor"}
                    </Text>
                    <Text style={styles.requestAlumniDetails}>
                      {item.alumniId ? `${item.alumniId.position} at ${item.alumniId.company}` : "Graduate Alumnus"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.requestStatusBadge,
                      { backgroundColor: `${statusColor}1c` },
                    ]}
                  >
                    <Text style={[styles.requestStatusText, { color: statusColor }]}>
                      {(item.status || "pending").toUpperCase()}
                    </Text>
                  </View>
                </View>

                {item.notes ? (
                  <View style={styles.requestNotesContainer}>
                    <Text style={styles.notesLabel}>Your Notes</Text>
                    <Text style={styles.notesText}>"{item.notes}"</Text>
                  </View>
                ) : null}

                <Text style={styles.requestDate}>Submitted on {dateStr}</Text>
              </View>
            );
          }}
        />
      )}

      {/* Request Mentorship Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={mentorshipModalVisible}
        onRequestClose={() => setMentorshipModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Mentorship Guidance</Text>
              <TouchableOpacity onPress={() => setMentorshipModalVisible(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedAlumni && (
              <ScrollView style={styles.formContainer}>
                <Text style={styles.mentorBriefLabel}>Mentor Profile</Text>
                <View style={styles.mentorBriefBox}>
                  <Text style={styles.mentorBriefName}>{selectedAlumni.userId?.name}</Text>
                  <Text style={styles.mentorBriefDetails}>
                    {selectedAlumni.position} at {selectedAlumni.company}
                  </Text>
                </View>

                <Text style={styles.label}>Guidance Notes / Purpose</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your career goals, area of interest (e.g. software engineer placement prep, higher studies guidance), and why you seek mentorship..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={5}
                  value={requestNotes}
                  onChangeText={setRequestNotes}
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.formCancelBtn}
                    onPress={() => setMentorshipModalVisible(false)}
                  >
                    <Text style={styles.formCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.formSubmitBtn}
                    onPress={handleSubmitRequest}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#161f2d" />
                    ) : (
                      <Text style={styles.formSubmitBtnText}>Submit Request</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e2634",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
  },
  mentorFilterBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  mentorFilterActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  mentorFilterInactive: {
    borderColor: "#232e41",
    backgroundColor: "#1e2634",
  },
  mentorFilterText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  alumniCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 12,
  },
  alumniHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  alumniAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  alumniMeta: {
    marginLeft: 12,
    flex: 1,
  },
  alumniName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  mentorBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  mentorBadgeText: {
    color: "#10B981",
    fontSize: 7,
    fontWeight: "bold",
  },
  alumniBatch: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  careerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  careerText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  alumniFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    paddingTop: 12,
  },
  linkedinBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkedinText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
  },
  mentorshipBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c084fc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mentorshipBtnText: {
    color: "#161f2d",
    fontSize: 10,
    fontWeight: "bold",
  },
  requestCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingBottom: 12,
    marginBottom: 12,
  },
  requestAlumniName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  requestAlumniDetails: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },
  requestStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requestStatusText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  requestNotesContainer: {
    backgroundColor: "#1a212d",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#232e41",
    padding: 12,
    marginBottom: 12,
  },
  notesLabel: {
    color: "#c084fc",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notesText: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
  },
  requestDate: {
    color: "#9CA3AF",
    fontSize: 10,
    alignSelf: "flex-end",
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
    maxHeight: "80%",
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
  mentorBriefLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
  },
  mentorBriefBox: {
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  mentorBriefName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  mentorBriefDetails: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
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
    height: 100,
    textAlignVertical: "top",
    paddingTop: 10,
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
