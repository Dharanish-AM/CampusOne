import React, { useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  LogOut,
  BookOpen,
  Clock,
  MapPin,
  Trophy,
  MessageSquare,
  Bell,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Calendar,
  Home,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { logoutUser } from "../../redux/slices/authSlice";
import { fetchDashboardData } from "../../redux/slices/dashboardSlice";

// ── Attendance ring (SVG-free lightweight approach) ───────────────────────────
const AttendanceRing = ({ percentage }) => {
  const pct = Math.min(100, Math.max(0, percentage ?? 100));
  const isLow = pct < 75;
  const color = isLow ? "#EF4444" : "#10B981";
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[styles.ringContainer, { transform: [{ scale: scaleAnim }] }]}
    >
      <View style={[styles.ringOuter, { borderColor: color }]}>
        <View style={styles.ringInner}>
          <Text style={[styles.ringPct, { color }]}>{pct}%</Text>
          <Text style={styles.ringLabel}>Attendance</Text>
        </View>
      </View>
      {isLow && (
        <View style={styles.lowBadge}>
          <AlertTriangle size={10} color="#EF4444" />
          <Text style={styles.lowBadgeText}>Below 75%</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ── Stat Pill ────────────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }) => (
  <View style={styles.statPill}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── Card Wrapper ──────────────────────────────────────────────────────────────
const Card = ({ children, style, onPress }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {children}
    </Wrapper>
  );
};

// ── Card Header Row ───────────────────────────────────────────────────────────
const CardHeader = ({ icon: Icon, iconColor, iconBg, title, onPress }) => (
  <View style={styles.cardHeader}>
    <View style={styles.cardHeaderLeft}>
      <View style={[styles.cardIconWrap, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {onPress && <ChevronRight size={16} color="#4B5563" />}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user } = useSelector((s) => s.auth);
  const { data, status, error } = useSelector((s) => s.dashboard);

  const isLoading = status === "loading" || status === "idle";
  const isRefreshing = status === "loading" && data !== null;

  // Fade-in animation for the whole page
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, []);

  useEffect(() => {
    if (status === "succeeded") {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  const onRefresh = useCallback(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const getInitials = (name) =>
    (name || "CO")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  // ── Skeleton loading state ────────────────────────────────────────────────
  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>Loading your dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profile = data?.profileSummary;
  const attendance = data?.attendanceSummary;
  const schedule = data?.todayTimetable ?? [];
  const bus = data?.busStatus;
  const lbRank = data?.leaderboardRank;
  const notifications = data?.notifications ?? [];
  const placement = data?.placementStatus;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Welcome back 👋</Text>
              <Text style={styles.userName}>{user?.name || "Student"}</Text>
              {profile?.rollNumber ? (
                <Text style={styles.subInfo}>
                  {profile.rollNumber} · {profile.department}
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => dispatch(logoutUser())}
            style={styles.logoutBtn}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#F87171" />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Attendance + stats ── */}
          <Card>
            <CardHeader
              icon={BookOpen}
              iconColor="#10B981"
              iconBg="rgba(16,185,129,0.12)"
              title="Attendance Overview"
              onPress={() => navigation.navigate("Attendance")}
            />
            <View style={styles.attendanceRow}>
              <AttendanceRing percentage={attendance?.overallPercentage} />
              <View style={styles.attendancePills}>
                <StatPill
                  label="Present"
                  value={attendance?.present ?? 0}
                  color="#10B981"
                />
                <StatPill
                  label="Absent"
                  value={attendance?.absent ?? 0}
                  color="#EF4444"
                />
                <StatPill
                  label="Leave"
                  value={attendance?.leave ?? 0}
                  color="#F59E0B"
                />
                <StatPill
                  label="Total"
                  value={attendance?.totalClasses ?? 0}
                  color="#c084fc"
                />
              </View>
            </View>
          </Card>

          {/* ── Today's Timetable ── */}
          <Card>
            <CardHeader
              icon={Clock}
              iconColor="#c084fc"
              iconBg="rgba(192, 132, 252, 0.12)"
              title="Today's Schedule"
              onPress={() => navigation.navigate("Timetable")}
            />
            {schedule.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={28} color="#374151" />
                <Text style={styles.emptyStateText}>No classes today</Text>
              </View>
            ) : (
              schedule.slice(0, 4).map((slot, i) => (
                <View
                  key={slot.id ?? i}
                  style={[
                    styles.slotRow,
                    i < schedule.length - 1 && styles.slotDivider,
                  ]}
                >
                  <View style={styles.slotTime}>
                    <Text style={styles.slotTimeText}>{slot.startTime}</Text>
                    <Text style={styles.slotTimeSub}>{slot.endTime}</Text>
                  </View>
                  <View style={styles.slotDot} />
                  <View style={styles.slotInfo}>
                    <Text style={styles.slotSubject}>{slot.subjectName}</Text>
                    <Text style={styles.slotMeta}>
                      {slot.subjectCode} · {slot.room || "TBD"}
                    </Text>
                  </View>
                </View>
              ))
            )}
            {schedule.length > 4 && (
              <TouchableOpacity
                onPress={() => navigation.navigate("Timetable")}
              >
                <Text style={styles.seeMore}>
                  +{schedule.length - 4} more classes →
                </Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* ── Bus + Leaderboard side by side ── */}
          <View style={styles.twoCol}>
            <Card
              style={styles.halfCard}
              onPress={() => navigation.navigate("Bus")}
            >
              <View
                style={[
                  styles.miniIconWrap,
                  { backgroundColor: "rgba(239,68,68,0.12)" },
                ]}
              >
                <MapPin size={18} color="#EF4444" />
              </View>
              <Text style={styles.miniCardTitle}>Bus Status</Text>
              {bus?.activeRoute === "No Active Bus" ? (
                <Text style={styles.miniCardSub}>No active bus</Text>
              ) : (
                <>
                  <Text style={styles.miniCardValue} numberOfLines={1}>
                    {bus?.activeRoute}
                  </Text>
                  {bus?.speed !== undefined && (
                    <Text style={styles.miniCardSub}>{bus.speed} km/h</Text>
                  )}
                  <View style={styles.liveDot}>
                    <View style={styles.liveDotPulse} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </>
              )}
            </Card>

            <Card
              style={styles.halfCard}
              onPress={() => navigation.navigate("Leaderboard")}
            >
              <View
                style={[
                  styles.miniIconWrap,
                  { backgroundColor: "rgba(245,158,11,0.12)" },
                ]}
              >
                <Trophy size={18} color="#F59E0B" />
              </View>
              <Text style={styles.miniCardTitle}>Leaderboard</Text>
              {lbRank?.rank ? (
                <>
                  <Text style={styles.miniCardRank}>#{lbRank.rank}</Text>
                  <Text style={styles.miniCardSub}>
                    {lbRank.score.toLocaleString()} pts
                  </Text>
                </>
              ) : (
                <Text style={styles.miniCardSub}>No entry yet</Text>
              )}
              <View style={styles.trendRow}>
                <TrendingUp size={12} color="#F59E0B" />
                <Text style={styles.trendText}>Global Rank</Text>
              </View>
            </Card>
          </View>

          {/* ── AI Chat CTA ── */}
          <Card onPress={() => navigation.navigate("AIChat")}>
            <View style={styles.aiRow}>
              <View
                style={[
                  styles.cardIconWrap,
                  { backgroundColor: "rgba(139,92,246,0.12)" },
                ]}
              >
                <MessageSquare size={16} color="#8B5CF6" />
              </View>
              <View style={styles.aiText}>
                <Text style={styles.aiTitle}>CampusBot AI Assistant</Text>
                <Text style={styles.aiSub}>
                  Ask about attendance, schedule, bus, or campus policies
                </Text>
              </View>
              <ChevronRight size={16} color="#8B5CF6" />
            </View>
          </Card>

          {/* ── Complaint Portal CTA ── */}
          <Card onPress={() => navigation.navigate("Complaint")}>
            <View style={styles.aiRow}>
              <View
                style={[
                  styles.cardIconWrap,
                  { backgroundColor: "rgba(239,68,68,0.12)" },
                ]}
              >
                <AlertTriangle size={16} color="#EF4444" />
              </View>
              <View style={styles.aiText}>
                <Text style={styles.aiTitle}>Grievance & Support Portal</Text>
                <Text style={styles.aiSub}>
                  File academic, hostel, or transport complaints and track
                  resolutions
                </Text>
              </View>
              <ChevronRight size={16} color="#EF4444" />
            </View>
          </Card>

          {/* ── Notifications ── */}
          {notifications.length > 0 && (
            <Card>
              <CardHeader
                icon={Bell}
                iconColor="#F59E0B"
                iconBg="rgba(245,158,11,0.12)"
                title={`Notifications (${notifications.length})`}
              />
              {notifications.map((n, i) => (
                <View
                  key={n.id ?? i}
                  style={[
                    styles.notifRow,
                    i < notifications.length - 1 && styles.notifDivider,
                  ]}
                >
                  <View style={styles.notifDot} />
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifMsg}>{n.message}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* ── Placement ── */}
          {placement && (
            <Card onPress={() => navigation.navigate("Placement")}>
              <CardHeader
                icon={Briefcase}
                iconColor={
                  placement.isEligible
                    ? "#10B981"
                    : placement.statusMessage.includes("Ineligible")
                      ? "#EF4444"
                      : "#6B7280"
                }
                iconBg={
                  placement.isEligible
                    ? "rgba(16,185,129,0.12)"
                    : placement.statusMessage.includes("Ineligible")
                      ? "rgba(239,68,68,0.12)"
                      : "rgba(107,114,128,0.12)"
                }
                title="Placement Status"
                onPress={() => navigation.navigate("Placement")}
              />
              <View
                style={[
                  styles.placementBadge,
                  {
                    borderColor: placement.isEligible
                      ? "#10B981"
                      : placement.statusMessage.includes("Ineligible")
                        ? "#EF4444"
                        : "#374151",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.placementStatus,
                    {
                      color: placement.isEligible
                        ? "#10B981"
                        : placement.statusMessage.includes("Ineligible")
                          ? "#EF4444"
                          : "#6B7280",
                    },
                  ]}
                >
                  {placement.isEligible
                    ? "✓ Eligible"
                    : placement.statusMessage.includes("Ineligible")
                      ? "✕ Ineligible"
                      : "⌛ Not Yet Eligible"}
                </Text>
              </View>
              <Text style={styles.placementMsg}>{placement.statusMessage}</Text>
            </Card>
          )}

          {/* ── Hostel Allocation ── */}
          <Card onPress={() => navigation.navigate("Hostel")}>
            <CardHeader
              icon={Home}
              iconColor="#10B981"
              iconBg="rgba(16,185,129,0.12)"
              title="Hostel & Gate Pass"
              onPress={() => navigation.navigate("Hostel")}
            />
            <View style={[styles.placementBadge, { borderColor: "#374151" }]}>
              <Text style={[styles.placementStatus, { color: "#10B981" }]}>
                View Room & Apply Pass
              </Text>
            </View>
            <Text style={styles.placementMsg}>
              Check your room details, roommates, and submit exit gate pass
              requests.
            </Text>
          </Card>

          {/* ── Library Status ── */}
          <Card onPress={() => navigation.navigate("Library")}>
            <CardHeader
              icon={BookOpen}
              iconColor="#10B981"
              iconBg="rgba(16,185,129,0.12)"
              title="Central Library"
              onPress={() => navigation.navigate("Library")}
            />
            <View style={[styles.placementBadge, { borderColor: "#374151" }]}>
              <Text style={[styles.placementStatus, { color: "#10B981" }]}>
                Search Catalog & Checkouts
              </Text>
            </View>
            <Text style={styles.placementMsg}>
              Browse books, view overdue alerts, and check fine balance dues.
            </Text>
          </Card>

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <AlertTriangle size={14} color="#F87171" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { color: "#9CA3AF", fontSize: 14 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#161f2d",
    borderWidth: 2,
    borderColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  greeting: { color: "#9CA3AF", fontSize: 12 },
  userName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Fraunces_600SemiBold",
    marginTop: 1,
  },
  subInfo: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "SpaceGrotesk_400Regular",
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(248,113,113,0.1)",
  },

  // Cards
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },

  // Attendance
  attendanceRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  ringContainer: { alignItems: "center", gap: 6 },
  ringOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: { alignItems: "center" },
  ringPct: { fontSize: 20, fontWeight: "800" },
  ringLabel: { color: "#6B7280", fontSize: 9, marginTop: 1 },
  lowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  lowBadgeText: { color: "#EF4444", fontSize: 9, fontWeight: "600" },
  attendancePills: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statPill: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 68,
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#6B7280", fontSize: 10, marginTop: 2 },

  // Timetable slots
  emptyState: { alignItems: "center", gap: 8, paddingVertical: 16 },
  emptyStateText: { color: "#4B5563", fontSize: 13 },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  slotDivider: { borderBottomWidth: 1, borderBottomColor: "#0f172a" },
  slotTime: { width: 52, alignItems: "flex-end" },
  slotTimeText: { color: "#9CA3AF", fontSize: 12, fontWeight: "600" },
  slotTimeSub: { color: "#4B5563", fontSize: 10 },
  slotDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#c084fc" },
  slotInfo: { flex: 1 },
  slotSubject: { color: "#E5E7EB", fontSize: 13, fontWeight: "600" },
  slotMeta: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  seeMore: {
    color: "#c084fc",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },

  // Two-column cards
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 0 },
  halfCard: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
  },
  miniIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  miniCardTitle: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  miniCardValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  miniCardRank: { color: "#F59E0B", fontSize: 24, fontWeight: "800" },
  miniCardSub: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  liveDot: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  liveDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveText: { color: "#10B981", fontSize: 10, fontWeight: "700" },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  trendText: { color: "#F59E0B", fontSize: 10, fontWeight: "600" },

  // AI CTA
  aiRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiText: { flex: 1 },
  aiTitle: { color: "#E5E7EB", fontSize: 14, fontWeight: "600" },
  aiSub: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  // Notifications
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
  },
  notifDivider: { borderBottomWidth: 1, borderBottomColor: "#0f172a" },
  notifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
    marginTop: 5,
  },
  notifContent: { flex: 1 },
  notifTitle: { color: "#E5E7EB", fontSize: 13, fontWeight: "600" },
  notifMsg: { color: "#9CA3AF", fontSize: 12, marginTop: 2, lineHeight: 18 },

  // Placement
  placementBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  placementStatus: { fontSize: 13, fontWeight: "700" },
  placementMsg: { color: "#6B7280", fontSize: 12, lineHeight: 18 },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: "#F87171", fontSize: 13, flex: 1 },
});
