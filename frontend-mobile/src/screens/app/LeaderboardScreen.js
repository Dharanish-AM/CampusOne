import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  Trophy,
  Code,
  GitBranch,
  Star,
  Zap,
  Edit3,
  X,
  ChevronUp,
  Award,
} from "lucide-react-native";

import {
  fetchLeaderboard,
  updateCodingHandles,
  clearLeaderboardError,
  setMyHandles,
} from "../../redux/slices/leaderboardSlice";
import { updateAuthProfile } from "../../redux/slices/authSlice";

const { width } = Dimensions.get("window");

const FILTER_OPTIONS = [
  { label: "Overall", key: "totalScore" },
  { label: "LeetCode", key: "leetcode" },
  { label: "Codeforces", key: "codeforces" },
  { label: "GitHub", key: "github" },
];

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const MEDAL_BG = [
  "rgba(255,215,0,0.15)",
  "rgba(192,192,192,0.1)",
  "rgba(205,127,50,0.1)",
];

// ─── Helper to compute platform-specific sort score ──────────────────────────
const getPlatformScore = (entry, key) => {
  switch (key) {
    case "leetcode":
      return entry.platform?.leetcode?.solved || 0;
    case "codeforces":
      return entry.platform?.codeforces?.rating || 0;
    case "github":
      return (
        (entry.platform?.github?.totalStars || 0) * 5 +
        (entry.platform?.github?.publicRepos || 0) * 2
      );
    default:
      return entry.totalScore || 0;
  }
};

// ─── Podium Card (Top 3) ──────────────────────────────────────────────────────
const PodiumCard = ({ entry, position, filterKey }) => {
  const glowAnim = useMemo(() => new Animated.Value(0.5), []);

  useEffect(() => {
    if (position === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, []);

  const score = getPlatformScore(entry, filterKey);
  const initials = (entry.userId?.name || "??")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.podiumCard, { backgroundColor: MEDAL_BG[position] }]}>
      {position === 0 && (
        <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
      )}
      <Text style={[styles.podiumMedal]}>{["🥇", "🥈", "🥉"][position]}</Text>
      <View
        style={[styles.podiumAvatar, { borderColor: MEDAL_COLORS[position] }]}
      >
        <Text style={styles.podiumAvatarText}>{initials}</Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.userId?.name || "Student"}
      </Text>
      <Text style={styles.podiumDept} numberOfLines={1}>
        {entry.studentId?.department || "—"}
      </Text>
      <View
        style={[
          styles.podiumScoreBadge,
          { borderColor: MEDAL_COLORS[position] },
        ]}
      >
        <Text style={[styles.podiumScore, { color: MEDAL_COLORS[position] }]}>
          {score.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

// ─── Row Card (rank 4+) ───────────────────────────────────────────────────────
const LeaderboardRow = ({ entry, onPress, filterKey }) => {
  const score = getPlatformScore(entry, filterKey);
  const initials = (entry.userId?.name || "??")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handles = entry.studentId?.codingHandles || {};

  return (
    <TouchableOpacity
      style={styles.rowCard}
      onPress={() => onPress(entry)}
      activeOpacity={0.75}
    >
      <Text style={styles.rowRank}>#{entry.rank}</Text>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.userId?.name || "Student"}
        </Text>
        <Text style={styles.rowDept} numberOfLines={1}>
          {entry.studentId?.department || "—"}
        </Text>
        <View style={styles.platformIcons}>
          {handles.leetcode && (
            <Code size={12} color="#fb923c" style={styles.platformIcon} />
          )}
          {handles.codeforces && (
            <Zap size={12} color="#60a5fa" style={styles.platformIcon} />
          )}
          {handles.github && (
            <GitBranch size={12} color="#a78bfa" style={styles.platformIcon} />
          )}
        </View>
      </View>
      <View style={styles.rowScoreBadge}>
        <Text style={styles.rowScore}>{score.toLocaleString()}</Text>
        <Text style={styles.rowScoreLabel}>pts</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Detail Bottom Sheet ──────────────────────────────────────────────────────
const DetailSheet = ({ entry, visible, onClose }) => {
  if (!entry) return null;
  const lc = entry.platform?.leetcode || {};
  const cf = entry.platform?.codeforces || {};
  const gh = entry.platform?.github || {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.sheetOverlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetName}>{entry.userId?.name || "Student"}</Text>
        <Text style={styles.sheetDept}>
          {entry.studentId?.department} · {entry.studentId?.rollNumber}
        </Text>

        <View style={styles.sheetStats}>
          {/* LeetCode */}
          <View
            style={[
              styles.sheetPlatform,
              {
                borderColor: "rgba(249, 115, 22, 0.3)",
                backgroundColor: "rgba(249, 115, 22, 0.15)",
              },
            ]}
          >
            <View style={styles.sheetPlatformHeader}>
              <Code size={16} color="#fb923c" />
              <Text style={[styles.sheetPlatformTitle, { color: "#fb923c" }]}>
                LeetCode
              </Text>
            </View>
            <Text style={styles.sheetStat}>
              Solved:{" "}
              <Text style={styles.sheetStatValue}>{lc.solved || 0}</Text>
            </Text>
            <Text style={styles.sheetStat}>
              Easy:{" "}
              <Text style={[styles.sheetStatValue, { color: "#4ADE80" }]}>
                {lc.easyCount || 0}
              </Text>{" "}
              Med:{" "}
              <Text style={[styles.sheetStatValue, { color: "#FBBF24" }]}>
                {lc.mediumCount || 0}
              </Text>{" "}
              Hard:{" "}
              <Text style={[styles.sheetStatValue, { color: "#F87171" }]}>
                {lc.hardCount || 0}
              </Text>
            </Text>
            <Text style={styles.sheetStat}>
              Global Rank:{" "}
              <Text style={styles.sheetStatValue}>
                {(lc.ranking || 0).toLocaleString()}
              </Text>
            </Text>
          </View>

          {/* Codeforces */}
          <View
            style={[
              styles.sheetPlatform,
              {
                borderColor: "rgba(59, 130, 246, 0.3)",
                backgroundColor: "rgba(59, 130, 246, 0.15)",
              },
            ]}
          >
            <View style={styles.sheetPlatformHeader}>
              <Zap size={16} color="#60a5fa" />
              <Text style={[styles.sheetPlatformTitle, { color: "#60a5fa" }]}>
                Codeforces
              </Text>
            </View>
            <Text style={styles.sheetStat}>
              Rating:{" "}
              <Text style={styles.sheetStatValue}>{cf.rating || 0}</Text>
            </Text>
            <Text style={styles.sheetStat}>
              Max Rating:{" "}
              <Text style={styles.sheetStatValue}>{cf.maxRating || 0}</Text>
            </Text>
            <Text style={styles.sheetStat}>
              Rank:{" "}
              <Text style={styles.sheetStatValue}>{cf.rank || "unrated"}</Text>
            </Text>
          </View>

          {/* GitHub */}
          <View style={styles.sheetPlatform}>
            <View style={styles.sheetPlatformHeader}>
              <GitBranch size={16} color="#9CA3AF" />
              <Text style={[styles.sheetPlatformTitle, { color: "#9CA3AF" }]}>
                GitHub
              </Text>
            </View>
            <Text style={styles.sheetStat}>
              Repos:{" "}
              <Text style={styles.sheetStatValue}>{gh.publicRepos || 0}</Text>
            </Text>
            <Text style={styles.sheetStat}>
              Stars:{" "}
              <Text style={styles.sheetStatValue}>{gh.totalStars || 0}</Text>
            </Text>
            <Text style={styles.sheetStat}>
              Followers:{" "}
              <Text style={styles.sheetStatValue}>{gh.followers || 0}</Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
          <X size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ─── Handles Edit Modal ───────────────────────────────────────────────────────
const HandlesModal = ({ visible, onClose, myHandles, onSave, saving }) => {
  const [form, setForm] = useState({
    leetcode: "",
    codeforces: "",
    github: "",
  });

  useEffect(() => {
    if (visible) {
      setForm({
        leetcode: myHandles?.leetcode || "",
        codeforces: myHandles?.codeforces || "",
        github: myHandles?.github || "",
      });
    }
  }, [visible, myHandles]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Edit Coding Handles</Text>
          <Text style={styles.modalSubtitle}>
            Link your profiles to appear on the leaderboard.
          </Text>

          <View style={styles.modalField}>
            <Code size={14} color="#FFA116" style={styles.modalFieldIcon} />
            <TextInput
              style={styles.modalInput}
              value={form.leetcode}
              onChangeText={(v) => setForm((p) => ({ ...p, leetcode: v }))}
              placeholder="LeetCode username"
              placeholderTextColor="#4B5563"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalField}>
            <Zap size={14} color="#5CC2F2" style={styles.modalFieldIcon} />
            <TextInput
              style={styles.modalInput}
              value={form.codeforces}
              onChangeText={(v) => setForm((p) => ({ ...p, codeforces: v }))}
              placeholder="Codeforces handle"
              placeholderTextColor="#4B5563"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalField}>
            <GitBranch
              size={14}
              color="#9CA3AF"
              style={styles.modalFieldIcon}
            />
            <TextInput
              style={styles.modalInput}
              value={form.github}
              onChangeText={(v) => setForm((p) => ({ ...p, github: v }))}
              placeholder="GitHub username"
              placeholderTextColor="#4B5563"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSave}
              onPress={() => onSave(form)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.modalSaveText}>Save & Sync</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const dispatch = useDispatch();
  const { entries, status, error, myHandles, handlesStatus, totalCount } =
    useSelector((s) => s.leaderboard);
  const { profile } = useSelector((s) => s.auth);

  const [activeFilter, setActiveFilter] = useState("totalScore");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showHandlesModal, setShowHandlesModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile?.codingHandles) {
      dispatch(setMyHandles(profile.codingHandles));
    }
  }, [profile, dispatch]);

  // Sort entries by the active filter key
  const sortedEntries = useMemo(() => {
    return [...entries]
      .sort(
        (a, b) =>
          getPlatformScore(b, activeFilter) - getPlatformScore(a, activeFilter),
      )
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }, [entries, activeFilter]);

  const top3 = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchLeaderboard());
    setRefreshing(false);
  }, [dispatch]);

  const handleSaveHandles = useCallback(
    async (form) => {
      const payload = {};
      if (form.leetcode !== undefined) payload.leetcode = form.leetcode || null;
      if (form.codeforces !== undefined)
        payload.codeforces = form.codeforces || null;
      if (form.github !== undefined) payload.github = form.github || null;

      const resultAction = await dispatch(updateCodingHandles(payload));
      if (updateCodingHandles.fulfilled.match(resultAction)) {
        dispatch(
          updateAuthProfile({
            codingHandles: resultAction.payload.codingHandles,
          }),
        );
      }
      setShowHandlesModal(false);
    },
    [dispatch],
  );

  const lastSynced = entries[0]?.lastSyncedAt
    ? new Date(entries[0].lastSyncedAt).toLocaleString("en-IN", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Trophy size={24} color="#c084fc" />
          <View>
            <Text style={styles.headerTitle}>Coding Leaderboard</Text>
            {lastSynced && (
              <Text style={styles.headerSync}>Synced {lastSynced}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.filterChip,
              activeFilter === opt.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(opt.key)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === opt.key && styles.filterChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {status === "loading" && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#c084fc" />
          <Text style={styles.loadingText}>Loading leaderboard…</Text>
        </View>
      ) : status === "failed" ? (
        <View style={styles.centered}>
          <Award size={48} color="#4B5563" />
          <Text style={styles.emptyTitle}>Could not load rankings</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => dispatch(fetchLeaderboard())}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Trophy size={56} color="#374151" />
          <Text style={styles.emptyTitle}>No Rankings Yet</Text>
          <Text style={styles.emptySubtitle}>
            Students with coding handles will appear here once the data is
            synced.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item._id || String(item.rank)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#c084fc"
              colors={["#c084fc"]}
            />
          }
          ListHeaderComponent={
            <>
              {/* Total count */}
              <Text style={styles.countLabel}>
                {totalCount} students ranked
              </Text>

              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <View style={styles.podiumRow}>
                  {/* 2nd place (left) */}
                  {top3[1] && (
                    <PodiumCard
                      entry={top3[1]}
                      position={1}
                      filterKey={activeFilter}
                    />
                  )}
                  {/* 1st place (center, taller) */}
                  {top3[0] && (
                    <View style={styles.podiumCenter}>
                      <PodiumCard
                        entry={top3[0]}
                        position={0}
                        filterKey={activeFilter}
                      />
                    </View>
                  )}
                  {/* 3rd place (right) */}
                  {top3[2] && (
                    <PodiumCard
                      entry={top3[2]}
                      position={2}
                      filterKey={activeFilter}
                    />
                  )}
                </View>
              )}

              <View style={styles.divider} />
            </>
          }
          renderItem={({ item }) => (
            <LeaderboardRow
              entry={item}
              onPress={setSelectedEntry}
              filterKey={activeFilter}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* My Handles Card (sticky bottom) */}
      <View style={styles.myHandlesCard}>
        <View style={styles.myHandlesInfo}>
          <Text style={styles.myHandlesTitle}>My Handles</Text>
          <View style={styles.myHandlesList}>
            {myHandles?.leetcode ? (
              <Text style={styles.myHandle}>
                <Text style={{ color: "#FFA116" }}>LC</Text>{" "}
                {myHandles.leetcode}
              </Text>
            ) : null}
            {myHandles?.codeforces ? (
              <Text style={styles.myHandle}>
                <Text style={{ color: "#5CC2F2" }}>CF</Text>{" "}
                {myHandles.codeforces}
              </Text>
            ) : null}
            {myHandles?.github ? (
              <Text style={styles.myHandle}>
                <Text style={{ color: "#9CA3AF" }}>GH</Text> {myHandles.github}
              </Text>
            ) : null}
            {!myHandles?.leetcode &&
              !myHandles?.codeforces &&
              !myHandles?.github && (
                <Text style={styles.myHandlesEmpty}>No handles linked yet</Text>
              )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.editHandlesBtn}
          onPress={() => setShowHandlesModal(true)}
          activeOpacity={0.8}
        >
          <Edit3 size={14} color="#000" />
          <Text style={styles.editHandlesText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Detail Bottom Sheet */}
      <DetailSheet
        entry={selectedEntry}
        visible={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />

      {/* Handles Edit Modal */}
      <HandlesModal
        visible={showHandlesModal}
        onClose={() => setShowHandlesModal(false)}
        myHandles={myHandles}
        onSave={handleSaveHandles}
        saving={handlesStatus === "loading"}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  headerSync: { fontSize: 11, color: "#64748B", marginTop: 2 },

  // Filter Chips
  filterRow: { maxHeight: 48 },
  filterRowContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1e2634",
    backgroundColor: "#161f2d",
  },
  filterChipActive: {
    borderColor: "#c084fc",
    backgroundColor: "rgba(192, 132, 252, 0.1)",
  },
  filterChipText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  filterChipTextActive: { color: "#c084fc", fontWeight: "700" },

  // States
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: { color: "#6B7280", marginTop: 12, fontSize: 14 },
  emptyTitle: {
    color: "#D1D5DB",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(192,132,252,0.15)",
    borderWidth: 1,
    borderColor: "#c084fc",
  },
  retryText: { color: "#c084fc", fontWeight: "700" },

  // Count label
  countLabel: {
    color: "#4B5563",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },

  // Podium
  podiumRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  podiumCenter: { marginBottom: 12 },
  podiumCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
    overflow: "hidden",
  },
  glowRing: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.35)",
  },
  podiumMedal: { fontSize: 22, marginBottom: 6 },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 8,
  },
  podiumAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  podiumName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_600SemiBold",
    textAlign: "center",
  },
  podiumDept: {
    color: "#6B7280",
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  podiumScoreBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  podiumScore: { fontSize: 13, fontWeight: "700" },

  divider: {
    height: 1,
    backgroundColor: "#1e2634",
    marginHorizontal: 16,
    marginBottom: 8,
  },

  // List rows
  listContent: { paddingBottom: 120, paddingHorizontal: 16 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    gap: 12,
  },
  rowRank: { color: "#4B5563", fontSize: 14, fontWeight: "700", minWidth: 28 },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  rowAvatarText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  rowInfo: { flex: 1 },
  rowName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  rowDept: { color: "#6B7280", fontSize: 12, marginTop: 1 },
  platformIcons: { flexDirection: "row", gap: 4, marginTop: 4 },
  platformIcon: { opacity: 0.9 },
  rowScoreBadge: { alignItems: "flex-end" },
  rowScore: { color: "#c084fc", fontSize: 16, fontWeight: "700" },
  rowScoreLabel: { color: "#6B7280", fontSize: 10 },

  // Detail Sheet
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheetContainer: {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    position: "relative",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Fraunces_600SemiBold",
  },
  sheetDept: { color: "#6B7280", fontSize: 13, marginBottom: 20 },
  sheetStats: { gap: 16 },
  sheetPlatform: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e2634",
  },
  sheetPlatformHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sheetPlatformTitle: { fontSize: 14, fontWeight: "700" },
  sheetStat: { color: "#9CA3AF", fontSize: 13, marginBottom: 4 },
  sheetStatValue: { color: "#FFFFFF", fontWeight: "600" },
  sheetClose: { position: "absolute", top: 16, right: 20 },

  // Handles Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#161f2d",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1e2634",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Fraunces_600SemiBold",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e2634",
    paddingHorizontal: 14,
    marginBottom: 12,
    height: 48,
    gap: 10,
  },
  modalFieldIcon: {},
  modalInput: { flex: 1, color: "#FFFFFF", fontSize: 14 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  modalCancelText: { color: "#9CA3AF", fontWeight: "600" },
  modalSave: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#c084fc",
  },
  modalSaveText: { color: "#000000", fontWeight: "700" },

  // My Handles bottom card
  myHandlesCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#161f2d",
    borderTopWidth: 1,
    borderTopColor: "#1e2634",
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
  },
  myHandlesInfo: { flex: 1 },
  myHandlesTitle: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  myHandlesList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  myHandle: { color: "#D1D5DB", fontSize: 12 },
  myHandlesEmpty: { color: "#4B5563", fontSize: 12, fontStyle: "italic" },
  editHandlesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#c084fc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editHandlesText: { color: "#000000", fontWeight: "700", fontSize: 13 },
});
