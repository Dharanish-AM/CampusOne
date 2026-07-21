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
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  Heart,
  Calendar,
  Clock,
  Plus,
  WifiOff,
  Wifi,
  X,
  Activity,
  FileText,
  AlertCircle,
  Stethoscope,
} from "lucide-react-native";
import {
  fetchStudentAppointments,
  bookAppointment,
  cancelAppointment,
  clearHealthErrors,
} from "../../redux/slices/healthSlice";

const { width } = Dimensions.get("window");

const DOCTORS = [
  "Dr. Lakshmi Prasad (MD) - General Medicine",
  "Dr. Anand Sharma (Ortho) - Orthopedics",
  "Dr. Kavya Iyer (Pedia) - Pediatrics & Wellness",
];

export default function HealthScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { appointments = [], isLoading = false, submitting = false, error = null } = useSelector(
    (state) => state.health || {}
  );

  // Component UI State
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0]);
  const [reason, setReason] = useState("");
  const [dateStr, setDateStr] = useState(""); // YYYY-MM-DD
  const [timeStr, setTimeStr] = useState(""); // HH:MM

  // Load appointments
  useEffect(() => {
    dispatch(fetchStudentAppointments());
  }, [dispatch, isSimulatedOffline]);

  // Handle appointment booking
  const handleBook = () => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "Booking appointments is disabled while offline.");
      return;
    }

    if (!reason.trim()) {
      Alert.alert("Missing Fields", "Please provide a reason for the appointment.");
      return;
    }

    if (!dateStr || !timeStr) {
      Alert.alert("Missing Fields", "Please specify the date and time.");
      return;
    }

    const dateTimeISO = `${dateStr}T${timeStr}:00`;
    if (isNaN(Date.parse(dateTimeISO))) {
      Alert.alert("Error", "Invalid Date/Time format. Please use YYYY-MM-DD and HH:MM.");
      return;
    }

    const doctorNameOnly = selectedDoctor.split(" - ")[0];

    dispatch(
      bookAppointment({
        doctorName: doctorNameOnly,
        reason,
        dateTime: new Date(dateTimeISO).toISOString(),
      })
    ).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        Alert.alert("Success", "Appointment booked successfully.");
        setModalVisible(false);
        setReason("");
        setDateStr("");
        setTimeStr("");
      }
    });
  };

  // Handle appointment cancellation
  const handleCancel = (id) => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "Cannot cancel appointments while offline.");
      return;
    }

    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            dispatch(cancelAppointment(id)).then((res) => {
              if (res.meta.requestStatus === "fulfilled") {
                Alert.alert("Cancelled", "Appointment has been cancelled.");
              }
            });
          },
        },
      ]
    );
  };

  // Vitals stats calculation
  const totalApprovedLeaveDays = appointments
    .filter((a) => a.status === "completed" && a.medicalLeaveApproved)
    .reduce((sum, current) => sum + (current.medicalLeaveDays || 0), 0);

  const nextScheduled = appointments.find((a) => a.status === "scheduled");

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Heart size={24} color="#f43f5e" style={styles.heartIcon} />
          <Text style={styles.headerTitle}>Health Center</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsSimulatedOffline(!isSimulatedOffline)}
          style={[styles.offlineToggle, isSimulatedOffline && styles.offlineToggleActive]}
        >
          {isSimulatedOffline ? (
            <WifiOff size={16} color="#fbbf24" />
          ) : (
            <Wifi size={16} color="#10b981" />
          )}
          <Text style={[styles.offlineToggleText, isSimulatedOffline && styles.offlineToggleTextActive]}>
            {isSimulatedOffline ? "Offline" : "Online"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offline banner */}
      {isSimulatedOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#b5179e" />
          <Text style={styles.offlineBannerText}>
            Simulated Offline Mode. Showing cached medical history records.
          </Text>
        </View>
      )}

      {/* Redux error message */}
      {error && (
        <View style={styles.errorAlert}>
          <AlertCircle size={18} color="#EF4444" />
          <Text style={styles.errorAlertText}>{error}</Text>
          <TouchableOpacity onPress={() => dispatch(clearHealthErrors())}>
            <X size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Vitals Summary Card */}
        <View style={styles.vitalsCard}>
          <Text style={styles.vitalsTitle}>Medical Leave & Visits Summary</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalBox}>
              <Activity size={20} color="#3b82f6" />
              <Text style={styles.vitalValue}>{totalApprovedLeaveDays} Days</Text>
              <Text style={styles.vitalLabel}>Approved Leave</Text>
            </View>

            <View style={styles.vitalBox}>
              <Clock size={20} color="#a855f7" />
              <Text style={styles.vitalValue}>
                {appointments.filter((a) => a.status === "completed").length} Visits
              </Text>
              <Text style={styles.vitalLabel}>Total Consults</Text>
            </View>
          </View>

          {nextScheduled && (
            <View style={styles.upcomingAppointmentBox}>
              <Calendar size={16} color="#c084fc" />
              <Text style={styles.upcomingAppointmentText}>
                Next Appointment: {new Date(nextScheduled.dateTime).toLocaleDateString()} with {nextScheduled.doctorName}
              </Text>
            </View>
          )}
        </View>

        {/* Schedule Button */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.bookBtn, isSimulatedOffline && styles.bookBtnDisabled]}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#ffffff" style={styles.btnIcon} />
          <Text style={styles.bookBtnText}>Schedule New Appointment</Text>
        </TouchableOpacity>

        {/* Appointments List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Appointment History</Text>
          {isLoading && <ActivityIndicator size="small" color="#c084fc" />}
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Stethoscope size={48} color="#475569" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No Medical History Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't scheduled any consults at the campus clinic yet.
            </Text>
          </View>
        ) : (
          appointments.map((item) => {
            const dateObj = new Date(item.dateTime);
            const dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeStr = dateObj.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            // Badge styling
            let statusBadgeStyle = styles.scheduledBadge;
            let statusBadgeText = styles.scheduledBadgeText;
            if (item.status === "completed") {
              statusBadgeStyle = styles.completedBadge;
              statusBadgeText = styles.completedBadgeText;
            } else if (item.status === "cancelled") {
              statusBadgeStyle = styles.cancelledBadge;
              statusBadgeText = styles.cancelledBadgeText;
            }

            return (
              <View
                key={item._id}
                style={[
                  styles.appointmentCard,
                  item.status === "scheduled" && styles.appointmentCardActive,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.doctorName}>{item.doctorName}</Text>
                    <Text style={styles.cardTime}>
                      {dateStr} at {timeStr}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, statusBadgeStyle]}>
                    <Text style={[styles.statusBadgeText, statusBadgeText]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.appointmentReasonLabel}>REASON FOR VISIT</Text>
                <Text style={styles.appointmentReason}>{item.reason}</Text>

                {item.prescription && (
                  <View style={styles.prescriptionBox}>
                    <FileText size={16} color="#94a3b8" style={styles.prescriptionIcon} />
                    <View style={styles.prescriptionContent}>
                      <Text style={styles.prescriptionLabel}>PRESCRIPTION & INSTRUCTIONS</Text>
                      <Text style={styles.prescriptionText}>{item.prescription}</Text>
                    </View>
                  </View>
                )}

                {item.status === "completed" && item.medicalLeaveApproved && (
                  <View style={styles.medicalLeaveBadge}>
                    <Activity size={14} color="#10b981" />
                    <Text style={styles.medicalLeaveBadgeText}>
                      Approved Medical Leave Exemption: {item.medicalLeaveDays} Days
                    </Text>
                  </View>
                )}

                {item.status === "scheduled" && (
                  <TouchableOpacity
                    onPress={() => handleCancel(item._id)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Booking Modal Form */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Clinic Appointment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>SELECT MEDICAL PRACTITIONER</Text>
              <View style={styles.doctorsContainer}>
                {DOCTORS.map((doc) => (
                  <TouchableOpacity
                    key={doc}
                    style={[
                      styles.doctorSelector,
                      selectedDoctor === doc && styles.doctorSelectorActive,
                    ]}
                    onPress={() => setSelectedDoctor(doc)}
                  >
                    <Text
                      style={[
                        styles.doctorSelectorText,
                        selectedDoctor === doc && styles.doctorSelectorTextActive,
                      ]}
                    >
                      {doc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>REASON FOR BOOKING</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Describe your health symptoms (e.g., body ache, fever, cough...)"
                placeholderTextColor="#475569"
                value={reason}
                onChangeText={setReason}
                multiline={true}
                numberOfLines={3}
              />

              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeCol}>
                  <Text style={styles.inputLabel}>DATE (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-07-25"
                    placeholderTextColor="#475569"
                    value={dateStr}
                    onChangeText={setDateStr}
                  />
                </View>

                <View style={styles.dateTimeCol}>
                  <Text style={styles.inputLabel}>TIME (HH:MM)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="10:30"
                    placeholderTextColor="#475569"
                    value={timeStr}
                    onChangeText={setTimeStr}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleBook}
                style={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm Booking Request</Text>
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
  safeContainer: {
    flex: 1,
    backgroundColor: "#0B0F19", // Deep space backdrop
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heartIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  offlineToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  offlineToggleActive: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.3)",
  },
  offlineToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
    marginLeft: 5,
  },
  offlineToggleTextActive: {
    color: "#fbbf24",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251,191,36,0.12)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(251,191,36,0.2)",
  },
  offlineBannerText: {
    fontSize: 11,
    color: "#fbbf24",
    marginLeft: 8,
    flex: 1,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorAlertText: {
    color: "#EF4444",
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  vitalsCard: {
    backgroundColor: "#161F2D",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 16,
  },
  vitalsTitle: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
    fontFamily: "SpaceGrotesk_600SemiBold",
    marginBottom: 12,
  },
  vitalsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vitalBox: {
    flex: 1,
    backgroundColor: "#0B0F19",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  vitalLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  upcomingAppointmentBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(192,132,252,0.08)",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(192,132,252,0.2)",
  },
  upcomingAppointmentText: {
    color: "#c084fc",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  bookBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  bookBtnDisabled: {
    backgroundColor: "#475569",
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 8,
  },
  bookBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#94a3b8",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  appointmentCard: {
    backgroundColor: "#161F2D",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 12,
  },
  appointmentCardActive: {
    borderColor: "rgba(99,102,241,0.4)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  cardTime: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  scheduledBadge: {
    backgroundColor: "rgba(99,102,241,0.12)",
  },
  scheduledBadgeText: {
    color: "#6366f1",
  },
  completedBadge: {
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  completedBadgeText: {
    color: "#10b981",
  },
  cancelledBadge: {
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  cancelledBadgeText: {
    color: "#EF4444",
  },
  appointmentReasonLabel: {
    fontSize: 9,
    color: "#475569",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 4,
  },
  appointmentReason: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
    marginBottom: 12,
  },
  prescriptionBox: {
    flexDirection: "row",
    backgroundColor: "#0B0F19",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginTop: 6,
  },
  prescriptionIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  prescriptionContent: {
    flex: 1,
  },
  prescriptionLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  prescriptionText: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 4,
    lineHeight: 16,
  },
  medicalLeaveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  medicalLeaveBadgeText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },
  cancelBtn: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 14,
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#161F2D",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    paddingBottom: 14,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingBottom: 40,
  },
  inputLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  doctorsContainer: {
    marginBottom: 10,
  },
  doctorSelector: {
    backgroundColor: "#0B0F19",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
    marginBottom: 8,
  },
  doctorSelectorActive: {
    borderColor: "#6366f1",
    backgroundColor: "rgba(99,102,241,0.08)",
  },
  doctorSelectorText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  doctorSelectorTextActive: {
    color: "#ffffff",
  },
  textInput: {
    backgroundColor: "#0B0F19",
    color: "#ffffff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    fontSize: 14,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  dateTimeCol: {
    flex: 1,
    marginRight: 8,
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
