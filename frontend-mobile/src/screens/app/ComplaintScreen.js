import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import {
  AlertTriangle,
  Plus,
  X,
  CircleCheck,
  Clock,
  CircleQuestionMark,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  BookOpen,
  Home,
  Bus,
  Coffee,
  Building,
} from "lucide-react-native";
import {
  fetchStudentComplaints,
  createComplaint,
  updateComplaintInState,
  clearComplaintError,
} from "../../redux/slices/complaintSlice";
import { SOCKET_URL } from "../../utils/api";

export default function ComplaintScreen({ navigation }) {
  const dispatch = useDispatch();
  const { complaints, isLoading, error } = useSelector(
    (state) => state.complaint,
  );
  const { profile } = useSelector((state) => state.auth);

  // Filter & Form state
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("academic");
  const [validationError, setValidationError] = useState("");

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 1. Fetch complaints on mount
  useEffect(() => {
    dispatch(fetchStudentComplaints());
  }, [dispatch]);

  // 2. Fade in screen contents when complaints finish loading
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  // 3. Socket.IO connection for real-time ticket resolution notices
  useEffect(() => {
    if (profile?._id) {
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        socket.emit("join", `student_${profile._id}`);
      });

      socket.on("complaint:update", (updatedComplaint) => {
        dispatch(updateComplaintInState(updatedComplaint));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [profile?._id, dispatch]);

  const handleCreateComplaint = async () => {
    if (!title.trim() || title.length < 3) {
      setValidationError("Title must be at least 3 characters long");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setValidationError("Description must be at least 10 characters long");
      return;
    }

    setValidationError("");
    const resultAction = await dispatch(
      createComplaint({ title, description, category }),
    );

    if (createComplaint.fulfilled.match(resultAction)) {
      setModalVisible(false);
      setTitle("");
      setDescription("");
      setCategory("academic");
    }
  };

  const getCategoryIcon = (cat, color = "#94a3b8") => {
    switch (cat) {
      case "academic":
        return <BookOpen size={16} color={color} />;
      case "hostel":
        return <Home size={16} color={color} />;
      case "transport":
        return <Bus size={16} color={color} />;
      case "cafeteria":
        return <Coffee size={16} color={color} />;
      case "infrastructure":
        return <Building size={16} color={color} />;
      default:
        return <CircleQuestionMark size={16} color={color} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { text: "#F59E0B", bg: "rgba(245,158,11,0.12)" };
      case "in_progress":
        return { text: "#A855F7", bg: "rgba(168,85,247,0.12)" };
      case "resolved":
        return { text: "#10B981", bg: "rgba(16,185,129,0.12)" };
      case "closed":
        return { text: "#64748B", bg: "rgba(100,116,139,0.12)" };
      default:
        return { text: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeFilter === "all") return true;
    return c.status === activeFilter;
  });

  // Calculations for stats
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "pending").length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "in_progress",
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "resolved" || c.status === "closed",
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color="#E5E7EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grievance Redressal</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Summary Panel */}
      <View style={styles.statsPanel}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{totalCount}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={[styles.statBox, styles.borderLeft]}>
          <Text style={[styles.statVal, { color: "#F59E0B" }]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
        <View style={[styles.statBox, styles.borderLeft]}>
          <Text style={[styles.statVal, { color: "#A855F7" }]}>
            {inProgressCount}
          </Text>
          <Text style={styles.statLbl}>Active</Text>
        </View>
        <View style={[styles.statBox, styles.borderLeft]}>
          <Text style={[styles.statVal, { color: "#10B981" }]}>
            {resolvedCount}
          </Text>
          <Text style={styles.statLbl}>Resolved</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {["all", "pending", "in_progress", "resolved"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter.replace("_", " ").toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List content */}
      {isLoading && complaints.length === 0 ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>
            Fetching your support tickets...
          </Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={filteredComplaints}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <AlertTriangle size={32} color="#334155" />
                <Text style={styles.emptyText}>
                  No complaints found under this filter.
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const colors = getStatusColor(item.status);
              const isSelected = selectedTicket === item._id;

              return (
                <View
                  style={[
                    styles.ticketCard,
                    isSelected && styles.ticketCardSelected,
                  ]}
                >
                  {/* Summary row */}
                  <TouchableOpacity
                    style={styles.cardSummary}
                    onPress={() =>
                      setSelectedTicket(isSelected ? null : item._id)
                    }
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.categoryBadge}>
                        {getCategoryIcon(item.category, "#c084fc")}
                        <Text style={styles.categoryText}>{item.category}</Text>
                      </View>
                      <Text style={styles.ticketTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.ticketDate}>
                        {new Date(item.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </Text>
                    </View>

                    <View style={styles.cardHeaderRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: colors.bg },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: colors.text }]}
                        >
                          {item.status.replace("_", " ").toUpperCase()}
                        </Text>
                      </View>
                      {isSelected ? (
                        <ChevronUp size={16} color="#475569" />
                      ) : (
                        <ChevronDown size={16} color="#475569" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Detail Panel */}
                  {isSelected && (
                    <View style={styles.expandedDetail}>
                      <View style={styles.divider} />
                      <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                      <Text style={styles.descriptionText}>
                        {item.description}
                      </Text>

                      {item.assignedTo && (
                        <View style={styles.assignedSection}>
                          <Text style={styles.sectionLabel}>
                            ASSIGNED FACULTY
                          </Text>
                          <Text style={styles.assignedName}>
                            {item.assignedTo?.userId?.name ||
                              "Faculty Assigned"}{" "}
                            ({item.assignedTo?.userId?.email || ""})
                          </Text>
                        </View>
                      )}

                      {/* Updates / Resolution Timeline */}
                      <Text style={styles.sectionLabel}>
                        RESOLUTION PROGRESS
                      </Text>
                      {item.updates && item.updates.length > 0 ? (
                        <View style={styles.timeline}>
                          {item.updates.map((update, idx) => {
                            const subColors = getStatusColor(update.status);
                            return (
                              <View
                                key={update._id || idx}
                                style={styles.timelineRow}
                              >
                                <View style={styles.timelineLeft}>
                                  <View
                                    style={[
                                      styles.timelineDot,
                                      { backgroundColor: subColors.text },
                                    ]}
                                  />
                                  {idx < item.updates.length - 1 && (
                                    <View style={styles.timelineLine} />
                                  )}
                                </View>
                                <View style={styles.timelineRight}>
                                  <View style={styles.timelineHeader}>
                                    <Text
                                      style={[
                                        styles.timelineStatus,
                                        { color: subColors.text },
                                      ]}
                                    >
                                      {update.status.toUpperCase()}
                                    </Text>
                                    <Text style={styles.timelineTime}>
                                      {new Date(
                                        update.updatedAt,
                                      ).toLocaleDateString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </Text>
                                  </View>
                                  <Text style={styles.timelineComment}>
                                    {update.comment}
                                  </Text>
                                  <Text style={styles.timelineBy}>
                                    Updated by:{" "}
                                    {update.updatedBy?.name || "Admin"}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={styles.noUpdates}>
                          No update remarks available yet.
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            }}
          />
        </Animated.View>
      )}

      {/* New Complaint Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBg}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>File a Complaint</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Modal Scroll Container */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formContainer}
            >
              {validationError ? (
                <View style={styles.formValidationError}>
                  <AlertTriangle size={14} color="#EF4444" />
                  <Text style={styles.validationErrorText}>
                    {validationError}
                  </Text>
                </View>
              ) : null}

              {/* Title Input */}
              <Text style={styles.inputLabel}>TITLE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief summary of the issue..."
                placeholderTextColor="#475569"
                value={title}
                onChangeText={setTitle}
              />

              {/* Category selector */}
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {[
                  "academic",
                  "hostel",
                  "transport",
                  "cafeteria",
                  "infrastructure",
                  "others",
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    {getCategoryIcon(
                      cat,
                      category === cat ? "#0f172a" : "#D1D5DB",
                    )}
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description Input */}
              <Text style={styles.inputLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.textInput, styles.descriptionInput]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholder="Detail your grievance, room numbers, routes, names or specific issues..."
                placeholderTextColor="#475569"
                value={description}
                onChangeText={setDescription}
              />

              {/* Submit button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateComplaint}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    Submit Complaint Ticket
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Deep slate dark mode
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2634",
    backgroundColor: "#161f2d",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  createBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  statsPanel: {
    flexDirection: "row",
    backgroundColor: "#161f2d",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e2634",
    paddingVertical: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: "#1e2634",
  },
  statVal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E5E7EB",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  statLbl: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderColor: "#1e2634",
  },
  filterTabActive: {
    borderColor: "#c084fc",
    backgroundColor: "rgba(192, 132, 252, 0.08)",
  },
  filterText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
  },
  filterTextActive: {
    color: "#c084fc",
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
  },
  ticketCard: {
    backgroundColor: "#161f2d",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e2634",
    marginBottom: 12,
    overflow: "hidden",
  },
  ticketCardSelected: {
    borderColor: "rgba(192, 132, 252, 0.4)",
  },
  cardSummary: {
    flexDirection: "row",
    padding: 16,
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(192, 132, 252, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#c084fc",
    textTransform: "capitalize",
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F3F4F6",
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  ticketDate: {
    fontSize: 10,
    color: "#475569",
    marginTop: 4,
  },
  cardHeaderRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  expandedDetail: {
    padding: 16,
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#1e2634",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  descriptionText: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  assignedSection: {
    marginBottom: 14,
  },
  assignedName: {
    fontSize: 13,
    color: "#E5E7EB",
    fontWeight: "500",
  },
  noUpdates: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
  },
  // Timeline design
  timeline: {
    marginTop: 8,
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 50,
  },
  timelineLeft: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#1e2634",
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 12,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  timelineStatus: {
    fontSize: 10,
    fontWeight: "800",
  },
  timelineTime: {
    fontSize: 9,
    color: "#475569",
  },
  timelineComment: {
    fontSize: 12,
    color: "#D1D5DB",
    lineHeight: 16,
  },
  timelineBy: {
    fontSize: 9.5,
    color: "#475569",
    marginTop: 2,
  },

  // Modal styling
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#1e2634",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2634",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  formValidationError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  validationErrorText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderColor: "#1e2634",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 16,
  },
  descriptionInput: {
    height: 120,
    paddingTop: 10,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderColor: "#1e2634",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  categoryChipText: {
    fontSize: 12,
    color: "#D1D5DB",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  categoryChipTextActive: {
    color: "#0f172a",
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#c084fc",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "700",
  },
});
