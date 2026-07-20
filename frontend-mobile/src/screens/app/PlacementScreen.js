import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import {
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  CircleCheck,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Link,
  Award,
  BookOpen,
  Info,
} from "lucide-react-native";
import {
  fetchJobs,
  applyJob,
  fetchStudentApplications,
  clearPlacementError,
  resetApplySuccess,
  updateApplicationInState,
} from "../../redux/slices/placementSlice";
import { SOCKET_URL } from "../../utils/api";

const { width } = Dimensions.get("window");

export default function PlacementScreen({ navigation }) {
  const dispatch = useDispatch();
  const { jobs, applications, isLoading, error, applySuccess } = useSelector(
    (state) => state.placement,
  );
  const { profile, user } = useSelector((state) => state.auth);

  // Tabs: 'jobs' or 'applied'
  const [activeTab, setActiveTab] = useState("jobs");
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Application Modal state
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 1. Initial Load
  useEffect(() => {
    dispatch(fetchJobs());
    dispatch(fetchStudentApplications());
  }, [dispatch]);

  // 2. Content Fade-In Animation
  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  // 3. Reset state on apply success
  useEffect(() => {
    if (applySuccess) {
      setApplyModalVisible(false);
      setResumeUrl("");
      setValidationError("");
      dispatch(resetApplySuccess());
      dispatch(fetchJobs()); // Refresh jobs to reflect applied status
    }
  }, [applySuccess, dispatch]);

  // 4. Socket.IO Real-Time listeners
  useEffect(() => {
    if (profile?._id) {
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        socket.emit("join", `student_${profile._id}`);
      });

      // Listening to notification updates (e.g. new drives or status changes)
      socket.on("notification:new", (notification) => {
        if (notification.type === "placement") {
          // Re-fetch placements and application history
          dispatch(fetchJobs());
          dispatch(fetchStudentApplications());
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [profile?._id, dispatch]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      dispatch(fetchJobs()).unwrap(),
      dispatch(fetchStudentApplications()).unwrap(),
    ]);
    setIsRefreshing(false);
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setValidationError("");
    setApplyModalVisible(true);
  };

  const submitApplication = async () => {
    if (!resumeUrl.trim()) {
      setValidationError("Resume link is required.");
      return;
    }

    // Basic URL regex validation
    const urlPattern =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlPattern.test(resumeUrl)) {
      setValidationError(
        "Please enter a valid resume URL (e.g. Google Drive, GitHub link)",
      );
      return;
    }

    setValidationError("");
    dispatch(applyJob({ jobId: selectedJob._id, resumeUrl }));
  };

  const toggleExpandJob = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "selected":
        return {
          bg: "rgba(16, 185, 129, 0.12)",
          border: "#10B981",
          text: "#10B981",
        };
      case "shortlisted":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          border: "#F59E0B",
          text: "#F59E0B",
        };
      case "rejected":
        return {
          bg: "rgba(239, 68, 68, 0.12)",
          border: "#EF4444",
          text: "#EF4444",
        };
      default:
        return {
          bg: "rgba(192, 132, 252, 0.12)",
          border: "#c084fc",
          text: "#c084fc",
        };
    }
  };

  const activeDrives = jobs.filter((j) => j.status === "active");
  const appliedCount = applications.length;
  const shortlistedCount = applications.filter(
    (a) => a.status === "shortlisted",
  ).length;
  const selectedCount = applications.filter(
    (a) => a.status === "selected",
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Placements</Text>
          <Text style={styles.headerSub}>
            Explore recruitment & application drives
          </Text>
        </View>
      </View>

      {/* STUDENT PROFILE ACADEMIC SUMMARY */}
      {profile && (
        <View style={styles.profileSummaryCard}>
          <Award size={18} color="#c084fc" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.name || "Student Profile"}
            </Text>
            <Text style={styles.profileMetrics}>
              CGPA:{" "}
              <Text style={styles.highlightText}>
                {profile.cgpa?.toFixed(2) || "0.00"}
              </Text>{" "}
              · Backlogs:{" "}
              <Text style={styles.highlightText}>{profile.backlogs ?? 0}</Text>{" "}
              · Sem:{" "}
              <Text style={styles.highlightText}>{profile.semester}</Text>
            </Text>
          </View>
        </View>
      )}

      {/* STATS OVERVIEW CARDS */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Active Drives</Text>
          <Text style={[styles.statValue, { color: "#FFFFFF" }]}>
            {activeDrives.length}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Applied</Text>
          <Text style={[styles.statValue, { color: "#c084fc" }]}>
            {appliedCount}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Shortlisted</Text>
          <Text style={[styles.statValue, { color: "#F59E0B" }]}>
            {shortlistedCount}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Selected</Text>
          <Text style={[styles.statValue, { color: "#10B981" }]}>
            {selectedCount}
          </Text>
        </View>
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => setActiveTab("jobs")}
          style={[styles.tab, activeTab === "jobs" && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Briefcase
            size={15}
            color={activeTab === "jobs" ? "#0f172a" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "jobs" && styles.tabTextActive,
            ]}
          >
            Active Opportunities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("applied")}
          style={[styles.tab, activeTab === "applied" && styles.tabActive]}
          activeOpacity={0.8}
        >
          <CircleCheck
            size={15}
            color={activeTab === "applied" ? "#0f172a" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "applied" && styles.tabTextActive,
            ]}
          >
            My Applications
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT LIST */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#c084fc"
            colors={["#c084fc"]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {isLoading && !isRefreshing && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#c084fc" />
              <Text style={styles.loadingText}>Fetching drives data...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ACTIVE OPPORTUNITIES TAB */}
          {activeTab === "jobs" &&
            !isLoading &&
            (activeDrives.length === 0 ? (
              <View style={styles.emptyState}>
                <Briefcase size={40} color="#374151" />
                <Text style={styles.emptyStateTitle}>
                  No Active Placement Drives
                </Text>
                <Text style={styles.emptyStateSub}>
                  Check back later for new career opportunities.
                </Text>
              </View>
            ) : (
              activeDrives.map((job) => {
                const isExpanded = expandedJobId === job._id;
                const dateText = new Date(job.deadline).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                );

                // Determine eligibility state
                const isEligible = job.isEligible ?? true;
                const hasApplied = job.hasApplied ?? false;

                return (
                  <View key={job._id} style={styles.jobCard}>
                    {/* Upper Row (Job overview header) */}
                    <TouchableOpacity
                      onPress={() => toggleExpandJob(job._id)}
                      activeOpacity={0.9}
                      style={styles.cardPressableHeader}
                    >
                      <View style={styles.cardMainInfo}>
                        <Text style={styles.companyName}>
                          {job.companyId?.name || "Company"}
                        </Text>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        <View style={styles.metaBadgeRow}>
                          <View style={styles.metaBadge}>
                            <MapPin size={10} color="#9CA3AF" />
                            <Text style={styles.metaBadgeText}>
                              {job.location}
                            </Text>
                          </View>
                          <View style={styles.metaBadge}>
                            <DollarSign size={10} color="#9CA3AF" />
                            <Text style={styles.metaBadgeText}>
                              {job.salaryPackage}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.cardRightInfo}>
                        {hasApplied ? (
                          <View
                            style={[
                              styles.eligibilityLabel,
                              styles.appliedLabel,
                            ]}
                          >
                            <CircleCheck size={10} color="#10B981" />
                            <Text style={styles.appliedLabelText}>Applied</Text>
                          </View>
                        ) : isEligible ? (
                          <View
                            style={[
                              styles.eligibilityLabel,
                              styles.eligibleLabel,
                            ]}
                          >
                            <CircleCheck size={10} color="#10B981" />
                            <Text style={styles.eligibleLabelText}>
                              Eligible
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.eligibilityLabel,
                              styles.ineligibleLabel,
                            ]}
                          >
                            <XCircle size={10} color="#EF4444" />
                            <Text style={styles.ineligibleLabelText}>
                              Ineligible
                            </Text>
                          </View>
                        )}
                        <Text style={styles.deadlineDate}>
                          Ends: {dateText}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded details */}
                    {isExpanded && (
                      <View style={styles.expandedDetails}>
                        <View style={styles.divider} />
                        <Text style={styles.sectionLabel}>Job Description</Text>
                        <Text style={styles.descriptionText}>
                          {job.description}
                        </Text>

                        <Text style={styles.sectionLabel}>
                          Skills & Requirements
                        </Text>
                        <Text style={styles.descriptionText}>
                          {job.requirements}
                        </Text>

                        <Text style={styles.sectionLabel}>
                          Criteria Thresholds
                        </Text>
                        <View style={styles.criteriaGrid}>
                          <View style={styles.criteriaItem}>
                            <Text style={styles.criteriaVal}>
                              Min CGPA: {job.minCgpa?.toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.criteriaItem}>
                            <Text style={styles.criteriaVal}>
                              Max Backlogs: {job.maxBacklogs}
                            </Text>
                          </View>
                        </View>

                        {/* Ineligibility reasons list */}
                        {!isEligible &&
                          job.reasons &&
                          job.reasons.length > 0 && (
                            <View style={styles.reasonsContainer}>
                              <Info size={12} color="#EF4444" />
                              <View style={styles.reasonsList}>
                                <Text style={styles.reasonsHeader}>
                                  Disqualifying factors:
                                </Text>
                                {job.reasons.map((r, idx) => (
                                  <Text key={idx} style={styles.reasonText}>
                                    • {r}
                                  </Text>
                                ))}
                              </View>
                            </View>
                          )}

                        {/* Action buttons */}
                        <View style={styles.actionsBlock}>
                          {hasApplied ? (
                            <View style={styles.successAppliedBlock}>
                              <Text style={styles.successAppliedText}>
                                Application Submitted:{" "}
                                {job.applicationStatus?.toUpperCase()}
                              </Text>
                            </View>
                          ) : isEligible ? (
                            <TouchableOpacity
                              onPress={() => handleApply(job)}
                              style={styles.applyButton}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.applyButtonText}>
                                Apply Now
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.disabledApplyButton}>
                              <Text style={styles.disabledApplyText}>
                                Criteria Mismatch
                              </Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => toggleExpandJob(job._id)}
                            style={styles.collapseBtn}
                          >
                            <ChevronUp size={16} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Expand indicator chevron on footer */}
                    {!isExpanded && (
                      <TouchableOpacity
                        onPress={() => toggleExpandJob(job._id)}
                        style={styles.cardFooterChevron}
                      >
                        <ChevronDown size={14} color="#4B5563" />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            ))}

          {/* MY APPLICATIONS TAB */}
          {activeTab === "applied" &&
            !isLoading &&
            (applications.length === 0 ? (
              <View style={styles.emptyState}>
                <CircleCheck size={40} color="#374151" />
                <Text style={styles.emptyStateTitle}>No Applications Yet</Text>
                <Text style={styles.emptyStateSub}>
                  You haven't submitted applications to any drives yet.
                </Text>
              </View>
            ) : (
              applications.map((app) => {
                const job = app.jobId;
                if (!job) return null;
                const appliedDate = new Date(app.appliedAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                );
                const statusStyle = getStatusStyle(app.status);

                return (
                  <View key={app._id} style={styles.applicationCard}>
                    <View style={styles.appCardHeader}>
                      <View>
                        <Text style={styles.appCompany}>
                          {job.companyId?.name || "Company"}
                        </Text>
                        <Text style={styles.appTitle}>{job.title}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusStyle.bg,
                            borderColor: statusStyle.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusStyle.text },
                          ]}
                        >
                          {app.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appCardFooter}>
                      <View style={styles.appFooterLeft}>
                        <Link size={10} color="#6B7280" />
                        <Text
                          style={styles.appResumeUrl}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {app.resumeUrl}
                        </Text>
                      </View>
                      <Text style={styles.appDate}>Applied: {appliedDate}</Text>
                    </View>
                  </View>
                );
              })
            ))}
        </Animated.View>
      </ScrollView>

      {/* APPLICATION MODAL SHEET */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Application</Text>
              <TouchableOpacity
                onPress={() => setApplyModalVisible(false)}
                style={styles.closeBtn}
              >
                <ChevronDown size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {selectedJob && (
                <View style={styles.modalJobHeader}>
                  <Text style={styles.modalCompany}>
                    {selectedJob.companyId?.name}
                  </Text>
                  <Text style={styles.modalJobTitle}>{selectedJob.title}</Text>
                  <Text style={styles.modalSalary}>
                    Package: {selectedJob.salaryPackage}
                  </Text>
                </View>
              )}

              {validationError ? (
                <View style={styles.formValidationError}>
                  <AlertCircle size={14} color="#EF4444" />
                  <Text style={styles.validationErrorText}>
                    {validationError}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>
                RESUME DOCUMENT LINK (GOOGLE DRIVE / GITHUB / DROPBOX)
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://drive.google.com/..."
                placeholderTextColor="#475569"
                value={resumeUrl}
                onChangeText={(text) => {
                  setResumeUrl(text);
                  if (validationError) setValidationError("");
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                onPress={submitApplication}
                style={styles.submitBtn}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0f172a" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginRight: 12,
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  headerSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },

  // Profile summary
  profileSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(192, 132, 252, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.15)",
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  profileMetrics: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  highlightText: { color: "#c084fc", fontWeight: "700" },

  // Stats Counters
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  statLabel: { fontSize: 9, color: "#6B7280", fontWeight: "700" },
  statValue: { fontSize: 16, fontWeight: "800", marginTop: 4 },

  // Filter Tabs
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#161f2d",
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 14,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: "#c084fc" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#0f172a", fontWeight: "700" },

  // List layout
  listContainer: { paddingHorizontal: 16, paddingBottom: 30 },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: { color: "#9CA3AF", fontSize: 12, marginTop: 10 },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  errorText: { color: "#EF4444", fontSize: 12, flex: 1 },

  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 50, gap: 8 },
  emptyStateTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyStateSub: { color: "#6B7280", fontSize: 12, textAlign: "center" },

  // Job Cards
  jobCard: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardPressableHeader: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMainInfo: { flex: 1, paddingRight: 8 },
  companyName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c084fc",
    textTransform: "uppercase",
  },
  jobTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginTop: 2 },
  metaBadgeRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#161f2d",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaBadgeText: { fontSize: 10, color: "#9CA3AF" },
  cardRightInfo: { alignItems: "flex-end", gap: 8 },
  deadlineDate: { fontSize: 9.5, color: "#475569" },

  // Eligibility Labels
  eligibilityLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eligibleLabel: { backgroundColor: "rgba(16, 185, 129, 0.1)" },
  eligibleLabelText: { color: "#10B981", fontSize: 10, fontWeight: "800" },
  appliedLabel: { backgroundColor: "rgba(16, 185, 129, 0.15)" },
  appliedLabelText: { color: "#10B981", fontSize: 10, fontWeight: "800" },
  ineligibleLabel: { backgroundColor: "rgba(239, 68, 68, 0.08)" },
  ineligibleLabelText: { color: "#EF4444", fontSize: 10, fontWeight: "800" },

  cardFooterChevron: {
    alignItems: "center",
    paddingVertical: 4,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.02)",
  },

  // Expanded card section
  expandedDetails: { padding: 14, paddingTop: 0 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  descriptionText: {
    fontSize: 12,
    color: "#D1D5DB",
    lineHeight: 17,
    marginBottom: 12,
  },
  criteriaGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  criteriaItem: {
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    padding: 8,
    flex: 1,
    alignItems: "center",
  },
  criteriaVal: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },

  // Disqualification reasons
  reasonsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  reasonsList: { flex: 1 },
  reasonsHeader: { fontSize: 11, fontWeight: "700", color: "#EF4444" },
  reasonText: {
    fontSize: 10.5,
    color: "#9CA3AF",
    marginTop: 2,
    lineHeight: 14,
  },

  // Expanded card action triggers
  actionsBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#c084fc",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  applyButtonText: { fontSize: 12, fontWeight: "800", color: "#0f172a" },
  disabledApplyButton: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  disabledApplyText: { fontSize: 12, color: "#475569", fontWeight: "700" },
  successAppliedBlock: {
    flex: 1,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  successAppliedText: { fontSize: 11.5, color: "#10B981", fontWeight: "700" },
  collapseBtn: {
    padding: 10,
    backgroundColor: "#161f2d",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Applied applications card
  applicationCard: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  appCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  appCompany: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c084fc",
    textTransform: "uppercase",
  },
  appTitle: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", marginTop: 2 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  appCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  appResumeUrl: { fontSize: 10.5, color: "#6B7280" },
  appDate: { fontSize: 9.5, color: "#475569" },

  // Modal slide-up sheet
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
    maxHeight: "80%",
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
  closeBtn: { padding: 4 },
  formContainer: { padding: 16, paddingBottom: 40 },
  modalJobHeader: { marginBottom: 16 },
  modalCompany: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c084fc",
    textTransform: "uppercase",
  },
  modalJobTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  modalSalary: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
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
  validationErrorText: { fontSize: 12, color: "#EF4444", fontWeight: "600" },
  inputLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
    marginBottom: 8,
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
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: "#c084fc",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
});
