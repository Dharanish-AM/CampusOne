import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { BookOpen, CheckCircle, AlertTriangle, Info, Calendar } from 'lucide-react-native';
import { fetchAttendance, handleSocketAttendanceUpdate } from '../../redux/slices/attendanceSlice';

const { width } = Dimensions.get('window');
const SOCKET_URL = 'http://10.0.2.2:5000'; // Match backend port

export default function AttendanceScreen() {
  const dispatch = useDispatch();
  const { user, profile } = useSelector((state) => state.auth);
  const { attendanceData, isLoading, error } = useSelector((state) => state.attendance);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history'

  // Fetch initial attendance aggregates
  useEffect(() => {
    dispatch(fetchAttendance());
  }, [dispatch]);

  // Handle Socket.IO connection for real-time attendance updates
  useEffect(() => {
    if (!profile?._id) return;

    // Establish WebSocket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    // Join room for this specific student
    socket.emit('join', `student_${profile._id}`);

    // Listen for live updates
    socket.on('attendance:update', (data) => {
      console.log('Received live attendance update:', data);
      dispatch(handleSocketAttendanceUpdate(data));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [profile, dispatch]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAttendanceThemeColor = (pct) => {
    if (pct < 75) return '#EF4444'; // Red
    if (pct < 85) return '#F59E0B'; // Orange/Amber
    return '#10B981'; // Emerald Green
  };

  if (isLoading && !attendanceData) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  const overallPct = attendanceData?.overallPercentage ?? 100;
  const themeColor = getAttendanceThemeColor(overallPct);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Portal</Text>
        <Text style={styles.headerSubtitle}>Real-time tracking & predictions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
          onPress={() => setActiveTab('overview')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, activeTab === 'overview' && styles.tabLabelActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>History Logs</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <AlertTriangle size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : activeTab === 'overview' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Overall Percentage Card */}
          <View style={styles.overallCard}>
            <View style={styles.gaugeContainer}>
              <View style={[styles.gaugeGlow, { backgroundColor: themeColor }]} />
              <View style={styles.gauge}>
                <Text style={[styles.gaugeText, { color: themeColor }]}>{overallPct}%</Text>
                <Text style={styles.gaugeLabel}>Overall</Text>
              </View>
            </View>
            <View style={styles.overallStats}>
              <Text style={styles.statLabel}>Attendance Status</Text>
              <Text style={[styles.statValue, { color: themeColor }]}>
                {overallPct >= 75 ? 'Safe (Above 75%)' : 'Shortage Warning!'}
              </Text>
              <Text style={styles.statSub}>
                Conducted: {attendanceData?.totalClasses || 0} classes | Attended: {attendanceData?.totalPresent || 0}
              </Text>
            </View>
          </View>

          {/* Subjects Logs */}
          <Text style={styles.sectionTitle}>Subject Aggregates</Text>

          {attendanceData?.subjects && attendanceData.subjects.length > 0 ? (
            attendanceData.subjects.map((sub) => {
              const subPct = sub.percentage;
              const subColor = getAttendanceThemeColor(subPct);
              
              return (
                <View key={sub.subject.id} style={[styles.subjectCard, { borderColor: `${subColor}30` }]}>
                  <View style={styles.subjectCardHeader}>
                    <View style={styles.subDetails}>
                      <Text style={styles.subCode}>{sub.subject.code}</Text>
                      <Text style={styles.subName}>{sub.subject.name}</Text>
                    </View>
                    <View style={[styles.percentBadge, { backgroundColor: `${subColor}15` }]}>
                      <Text style={[styles.percentBadgeText, { color: subColor }]}>{subPct}%</Text>
                    </View>
                  </View>

                  <View style={styles.subMetrics}>
                    <Text style={styles.metricText}>
                      Present: <Text style={styles.boldText}>{sub.present}</Text> | Absent: <Text style={styles.boldText}>{sub.absent}</Text>
                      {sub.leave > 0 && ` | Leaves: ${sub.leave}`}
                    </Text>
                    <Text style={styles.metricText}>Classes: {sub.total}</Text>
                  </View>

                  {/* Predictions */}
                  <View style={[
                    styles.predictionContainer, 
                    { backgroundColor: sub.prediction.status === 'safe' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }
                  ]}>
                    {sub.prediction.status === 'safe' ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <AlertTriangle size={16} color="#EF4444" />
                    )}
                    <Text style={[
                      styles.predictionText,
                      { color: sub.prediction.status === 'safe' ? '#10B981' : '#EF4444' }
                    ]}>
                      {sub.prediction.message}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <BookOpen size={36} color="#4B5563" />
              <Text style={styles.emptyText}>No subject aggregates found.</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* History logs */
        <FlatList
          data={attendanceData?.logs || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isPresent = item.status === 'present';
            const isLeave = item.status === 'leave';
            const statusColor = isPresent ? '#10B981' : isLeave ? '#F59E0B' : '#EF4444';

            return (
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historySubInfo}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historySubCode}>{item.subjectCode}</Text>
                <Text style={styles.historySubName}>{item.subjectName}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={36} color="#4B5563" />
              <Text style={styles.emptyText}>No historical logs recorded yet.</Text>
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
    backgroundColor: '#090D1A',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#090D1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8A99AD',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1F2937',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  overallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  gaugeContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeGlow: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    opacity: 0.15,
  },
  gauge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#090D1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1F2937',
  },
  gaugeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  gaugeLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  overallStats: {
    flex: 1,
    marginLeft: 20,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  subjectCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  subjectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subDetails: {
    flex: 1,
    marginRight: 12,
  },
  subCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  subName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  subMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 10,
  },
  metricText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  boldText: {
    color: '#F3F4F6',
    fontWeight: '600',
  },
  predictionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  predictionText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  historyCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historySubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historySubCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  historySubName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
});
