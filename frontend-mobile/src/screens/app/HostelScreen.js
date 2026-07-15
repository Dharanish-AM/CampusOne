import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  Home,
  Users,
  User,
  Clock,
  Plus,
  X,
  FileText,
  AlertCircle,
  Calendar,
  ArrowRight,
  ShieldAlert,
} from "lucide-react-native";
import {
  fetchHostelAllocation,
  fetchGatePasses,
  submitGatePassRequest,
  clearHostelErrors,
} from "../../redux/slices/hostelSlice";

export default function HostelScreen() {
  const dispatch = useDispatch();

  // Redux state
  const {
    allocation,
    warden,
    roommates,
    gatePasses,
    loading,
    submitting,
    error,
    submitError,
  } = useSelector((state) => state.hostel);

  // Form states
  const [modalVisible, setModalVisible] = useState(false);
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("outing"); // outing or home
  const [departureDate, setDepartureDate] = useState(""); // YYYY-MM-DD
  const [departureTime, setDepartureTime] = useState(""); // HH:MM
  const [returnDate, setReturnDate] = useState(""); // YYYY-MM-DD
  const [returnTime, setReturnTime] = useState(""); // HH:MM

  // Load data
  useEffect(() => {
    dispatch(fetchHostelAllocation());
    dispatch(fetchGatePasses());
  }, [dispatch]);

  // Handle gate pass submit
  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason for leave.");
      return;
    }
    if (!departureDate || !departureTime || !returnDate || !returnTime) {
      Alert.alert("Error", "Please complete all date and time fields.");
      return;
    }

    // Combine strings to ISO dates
    const departureISO = `${departureDate}T${departureTime}:00`;
    const returnISO = `${returnDate}T${returnTime}:00`;

    if (isNaN(Date.parse(departureISO)) || isNaN(Date.parse(returnISO))) {
      Alert.alert(
        "Error",
        "Invalid Date/Time formats. Please use YYYY-MM-DD and HH:MM format.",
      );
      return;
    }

    dispatch(
      submitGatePassRequest({
        reason,
        leaveType,
        departureTime: new Date(departureISO).toISOString(),
        expectedReturnTime: new Date(returnISO).toISOString(),
      }),
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        Alert.alert("Success", "Gate pass requested successfully.");
        setModalVisible(false);
        setReason("");
        setDepartureDate("");
        setDepartureTime("");
        setReturnDate("");
        setReturnTime("");
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "#10B981"; // Emerald
      case "rejected":
        return "#EF4444"; // Red
      default:
        return "#F59E0B"; // Yellow/Amber
    }
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hostel Management</Text>
          <Text style={styles.headerSubtitle}>
            Room allocation & gate passes
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            dispatch(clearHostelErrors());
            setModalVisible(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Request Leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && gatePasses.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Fetching hostel info...</Text>
          </View>
        ) : (
          <>
            {/* ── Room Details ── */}
            <View style={styles.sectionHeader}>
              <Home size={18} color="#10B981" />
              <Text style={styles.sectionTitle}>Room Allocation</Text>
            </View>

            {allocation ? (
              <View style={styles.card}>
                <View style={styles.roomRow}>
                  <View>
                    <Text style={styles.roomLabel}>Block</Text>
                    <Text style={styles.roomVal}>{allocation.block}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View>
                    <Text style={styles.roomLabel}>Room Number</Text>
                    <Text style={styles.roomVal}>{allocation.roomNumber}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View>
                    <Text style={styles.roomLabel}>Warden</Text>
                    <Text style={styles.roomVal}>{warden?.name || "N/A"}</Text>
                  </View>
                </View>

                {/* Roommate details */}
                {roommates && roommates.length > 0 && (
                  <View style={styles.roommatesSection}>
                    <Text style={styles.subTitle}>
                      <Users
                        size={14}
                        color="#9CA3AF"
                        style={{ marginRight: 6 }}
                      />{" "}
                      Roommates
                    </Text>
                    {roommates.map((rm) => (
                      <View key={rm.studentId} style={styles.roommateRow}>
                        <View style={styles.avatar}>
                          <User size={14} color="#10B981" />
                        </View>
                        <View>
                          <Text style={styles.roommateName}>{rm.name}</Text>
                          <Text style={styles.roommateMeta}>
                            {rm.rollNumber} • {rm.department}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAllocationCard}>
                <ShieldAlert size={28} color="#EF4444" />
                <Text style={styles.noAllocationText}>
                  No hostel room allocated to your profile yet. Contact your
                  warden or admin desk.
                </Text>
              </View>
            )}

            {/* ── Gate Pass History ── */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Clock size={18} color="#10B981" />
              <Text style={styles.sectionTitle}>Gate Pass History</Text>
            </View>

            {gatePasses.length === 0 ? (
              <View style={styles.emptyHistoryCard}>
                <FileText size={24} color="#6B7280" />
                <Text style={styles.emptyHistoryText}>
                  No gate passes requested yet.
                </Text>
              </View>
            ) : (
              gatePasses.map((gp) => (
                <View key={gp._id} style={styles.gatePassCard}>
                  <View style={styles.gpCardHeader}>
                    <View
                      style={[
                        styles.leaveBadge,
                        {
                          backgroundColor:
                            gp.leaveType === "home"
                              ? "rgba(59,130,246,0.12)"
                              : "rgba(16,185,129,0.12)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.leaveBadgeText,
                          {
                            color:
                              gp.leaveType === "home" ? "#3B82F6" : "#10B981",
                          },
                        ]}
                      >
                        {gp.leaveType === "home" ? "Home Leave" : "Outing"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { borderColor: getStatusColor(gp.status) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: getStatusColor(gp.status) },
                        ]}
                      >
                        {gp.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.gpReason}>{gp.reason}</Text>

                  {/* Dates Row */}
                  <View style={styles.datesRow}>
                    <View style={styles.dateCol}>
                      <Calendar size={12} color="#9CA3AF" />
                      <Text style={styles.dateText}>
                        {formatDate(gp.departureTime)}
                      </Text>
                    </View>
                    <ArrowRight size={14} color="#9CA3AF" />
                    <View style={styles.dateCol}>
                      <Calendar size={12} color="#9CA3AF" />
                      <Text style={styles.dateText}>
                        {formatDate(gp.expectedReturnTime)}
                      </Text>
                    </View>
                  </View>

                  {/* Rejection comment */}
                  {gp.status === "rejected" && gp.rejectionReason && (
                    <View style={styles.rejectionCard}>
                      <AlertCircle size={14} color="#EF4444" />
                      <Text style={styles.rejectionText}>
                        Reason: {gp.rejectionReason}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── Request Gate Pass Modal ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Gate Pass</Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {submitError && (
              <View style={styles.errorAlert}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.errorAlertText}>{submitError}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type select */}
              <Text style={styles.inputLabel}>Leave Type</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    leaveType === "outing" && styles.typeOptionSelected,
                  ]}
                  onPress={() => setLeaveType("outing")}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      leaveType === "outing" && styles.typeOptionTextActive,
                    ]}
                  >
                    Outing
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    leaveType === "home" && styles.typeOptionSelected,
                  ]}
                  onPress={() => setLeaveType("home")}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      leaveType === "home" && styles.typeOptionTextActive,
                    ]}
                  >
                    Home Leave
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Departure dates */}
              <Text style={styles.inputLabel}>Departure Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD (e.g. 2026-07-20)"
                placeholderTextColor="#6B7280"
                value={departureDate}
                onChangeText={setDepartureDate}
              />

              <Text style={styles.inputLabel}>Departure Time</Text>
              <TextInput
                style={styles.textInput}
                placeholder="HH:MM (e.g. 14:30)"
                placeholderTextColor="#6B7280"
                value={departureTime}
                onChangeText={setDepartureTime}
              />

              {/* Expected return dates */}
              <Text style={styles.inputLabel}>Expected Return Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD (e.g. 2026-07-22)"
                placeholderTextColor="#6B7280"
                value={returnDate}
                onChangeText={setReturnDate}
              />

              <Text style={styles.inputLabel}>Expected Return Time</Text>
              <TextInput
                style={styles.textInput}
                placeholder="HH:MM (e.g. 18:00)"
                placeholderTextColor="#6B7280"
                value={returnTime}
                onChangeText={setReturnTime}
              />

              {/* Reason */}
              <Text style={styles.inputLabel}>Reason for Leave</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Explain the detailed purpose of your outing or home leave request..."
                placeholderTextColor="#6B7280"
                multiline={true}
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
              />

              {/* Action Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
  },
  roomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    textTransform: "uppercase",
  },
  roomVal: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#374151",
  },
  roommatesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  subTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  roommateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(16,185,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  roommateName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  roommateMeta: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 1,
  },
  noAllocationCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  noAllocationText: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  emptyHistoryCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  emptyHistoryText: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 8,
  },
  gatePassCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  gpCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leaveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaveBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  gpReason: {
    color: "#F3F4F6",
    fontSize: 13,
    marginVertical: 12,
    lineHeight: 18,
  },
  datesRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 10,
    borderRadius: 8,
  },
  dateCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginLeft: 6,
  },
  rejectionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  rejectionText: {
    color: "#EF4444",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1F2937",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#374151",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeModalButton: {
    padding: 4,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorAlertText: {
    color: "#EF4444",
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  inputLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 12,
  },
  typeSelectorRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  typeOption: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    marginRight: 8,
  },
  typeOptionSelected: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  typeOptionText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  typeOptionTextActive: {
    color: "#10B981",
  },
  textInput: {
    backgroundColor: "#111827",
    color: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
    fontSize: 14,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});
