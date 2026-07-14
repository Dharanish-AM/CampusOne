import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
} from "lucide-react-native";
import { fetchTimetable } from "../../redux/slices/timetableSlice";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimetableScreen() {
  const dispatch = useDispatch();
  const { schedule, isLoading, error } = useSelector(
    (state) => state.timetable,
  );

  // Initialize selected day to today's day of week, defaulting to Monday if Sunday/unsupported
  const getTodayDayOfWeek = () => {
    const dayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday...
    const daysMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayStr = daysMap[dayIndex];
    return DAYS_OF_WEEK.includes(todayStr) ? todayStr : "Monday";
  };

  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek());
  const [viewMode, setViewMode] = useState("classes"); // 'classes' | 'exams'

  useEffect(() => {
    dispatch(fetchTimetable());
  }, [dispatch]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFilteredClasses = () => {
    return schedule.filter(
      (item) => item.isRecurring && item.dayOfWeek === selectedDay,
    );
  };

  const getFilteredExams = () => {
    return schedule
      .filter((item) => !item.isRecurring)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const renderClassItem = ({ item }) => {
    return (
      <View style={styles.classCard}>
        {/* Time Timeline indicator */}
        <View style={styles.timeSection}>
          <Clock size={16} color="#c084fc" />
          <Text style={styles.timeText}>{item.startTime}</Text>
          <Text style={styles.timeDivider}>|</Text>
          <Text style={styles.timeText}>{item.endTime}</Text>
        </View>

        {/* Course Card Details */}
        <View style={styles.classDetails}>
          <View style={styles.classHeader}>
            <Text style={styles.classCode}>
              {item.subjectId?.code || "SUB"}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {item.type.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.className}>
            {item.subjectId?.name || "Subject"}
          </Text>

          <View style={styles.infoRowContainer}>
            <View style={styles.infoIconText}>
              <MapPin size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>Room {item.roomNumber}</Text>
            </View>
            <View style={styles.infoIconText}>
              <User size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>
                {item.facultyId?.userId?.name || "Prof. Faculty"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderExamItem = ({ item }) => {
    return (
      <View style={[styles.classCard, styles.examCard]}>
        <View style={[styles.timeSection, styles.examTimeSection]}>
          <Calendar size={16} color="#F59E0B" />
          <Text style={styles.examDateText}>{formatDate(item.date)}</Text>
          <Text style={styles.timeText}>
            {item.startTime} - {item.endTime}
          </Text>
        </View>

        <View style={styles.classDetails}>
          <View style={styles.classHeader}>
            <Text style={[styles.classCode, { color: "#F59E0B" }]}>
              {item.subjectId?.code || "SUB"}
            </Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: "rgba(245, 158, 11, 0.15)" },
              ]}
            >
              <Text style={[styles.typeBadgeText, { color: "#F59E0B" }]}>
                EXAM
              </Text>
            </View>
          </View>
          <Text style={styles.className}>
            {item.subjectId?.name || "Subject"}
          </Text>

          <View style={styles.infoRowContainer}>
            <View style={styles.infoIconText}>
              <MapPin size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>Hall: {item.roomNumber}</Text>
            </View>
            <View style={styles.infoIconText}>
              <User size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>
                Invigilator: {item.facultyId?.userId?.name || "Staff"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Timetable Scheduler</Text>
        <Text style={styles.headerSubtitle}>
          Weekly slots and upcoming exams
        </Text>
      </View>

      {/* Mode Selector (Classes vs Exams) */}
      <View style={styles.modeTabBar}>
        <TouchableOpacity
          style={[
            styles.modeTabButton,
            viewMode === "classes" && styles.modeTabButtonActive,
          ]}
          onPress={() => setViewMode("classes")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modeTabLabel,
              viewMode === "classes" && styles.modeTabLabelActive,
            ]}
          >
            Classes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeTabButton,
            viewMode === "exams" && styles.modeTabButtonActive,
          ]}
          onPress={() => setViewMode("exams")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.modeTabLabel,
              viewMode === "exams" && styles.modeTabLabelActive,
            ]}
          >
            Exams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditionally Render Day Selector for Classes */}
      {viewMode === "classes" && (
        <View style={styles.daySelectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, isSelected && styles.dayChipActive]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      isSelected && styles.dayChipTextActive,
                    ]}
                  >
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <AlertTriangle size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
        </View>
      ) : (
        <FlatList
          data={
            viewMode === "classes" ? getFilteredClasses() : getFilteredExams()
          }
          keyExtractor={(item) => item._id}
          renderItem={viewMode === "classes" ? renderClassItem : renderExamItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={36} color="#4B5563" />
              <Text style={styles.emptyText}>
                {viewMode === "classes"
                  ? `No classes scheduled for ${selectedDay}.`
                  : "No upcoming exams scheduled."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8A99AD",
    marginTop: 4,
  },
  modeTabBar: {
    flexDirection: "row",
    backgroundColor: "#161f2d",
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e2634",
  },
  modeTabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  modeTabButtonActive: {
    backgroundColor: "#1e2634",
  },
  modeTabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  modeTabLabelActive: {
    color: "#FFFFFF",
  },
  daySelectorContainer: {
    marginBottom: 16,
  },
  daySelectorScroll: {
    paddingHorizontal: 24,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderColor: "#1e2634",
    marginRight: 8,
  },
  dayChipActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  dayChipTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  classCard: {
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderColor: "#1e2634",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  examCard: {
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  timeSection: {
    width: 75,
    borderRightWidth: 1,
    borderRightColor: "#1e2634",
    paddingRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  examTimeSection: {
    width: 95,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  timeDivider: {
    color: "#374151",
    fontSize: 10,
    marginVertical: 2,
  },
  examDateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
    textAlign: "center",
    marginTop: 4,
  },
  classDetails: {
    flex: 1,
    paddingLeft: 16,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  classCode: {
    fontSize: 11,
    fontWeight: "800",
    color: "#c084fc",
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(192, 132, 252, 0.15)",
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#c084fc",
  },
  className: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  infoRowContainer: {
    flexDirection: "row",
    marginTop: 10,
    flexWrap: "wrap",
  },
  infoIconText: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#4B5563",
    fontSize: 14,
    marginTop: 10,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 12,
    flex: 1,
  },
});
