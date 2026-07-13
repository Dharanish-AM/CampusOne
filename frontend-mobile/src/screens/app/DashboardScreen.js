import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, User as UserIcon, BookOpen, Clock, MapPin, Trophy, MessageSquare } from 'lucide-react-native';
import { logoutUser } from '../../redux/slices/authSlice';

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const { user, profile } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const getInitials = (name) => {
    if (!name) return 'CO';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Area */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.welcome}>Welcome back,</Text>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <LogOut size={20} color="#F87171" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <UserIcon size={18} color="#6366F1" />
            <Text style={styles.cardTitle}>Profile Summary</Text>
          </View>
          
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>

            {user?.role === 'student' && profile && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Roll Number</Text>
                  <Text style={styles.infoValue}>{profile.rollNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{profile.department}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Semester</Text>
                  <Text style={styles.infoValue}>Semester {profile.semester}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Batch</Text>
                  <Text style={styles.infoValue}>{profile.batch}</Text>
                </View>
              </>
            )}

            {user?.role === 'faculty' && profile && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Employee ID</Text>
                  <Text style={styles.infoValue}>{profile.employeeId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{profile.department}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Designation</Text>
                  <Text style={styles.infoValue}>{profile.designation}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Feature Grid placeholders for Phase 1 */}
        <Text style={styles.sectionTitle}>Phase 1 Modules Scaffolding</Text>

        <View style={styles.grid}>
          {/* Module 2: Attendance */}
          <View style={styles.gridItem}>
            <View style={[styles.gridIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <BookOpen size={24} color="#10B981" />
            </View>
            <Text style={styles.gridLabel}>Attendance</Text>
            <Text style={styles.gridSub}>Track daily/subject logs</Text>
          </View>

          {/* Module 3: Timetable */}
          <View style={styles.gridItem}>
            <View style={[styles.gridIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Clock size={24} color="#6366F1" />
            </View>
            <Text style={styles.gridLabel}>Timetable</Text>
            <Text style={styles.gridSub}>View daily schedules</Text>
          </View>

          {/* Module 4: Bus Tracking */}
          <View style={styles.gridItem}>
            <View style={[styles.gridIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <MapPin size={24} color="#EF4444" />
            </View>
            <Text style={styles.gridLabel}>Bus Tracking</Text>
            <Text style={styles.gridSub}>Live coordinates on map</Text>
          </View>

          {/* Module 5: Leaderboard */}
          <View style={styles.gridItem}>
            <View style={[styles.gridIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Trophy size={24} color="#F59E0B" />
            </View>
            <Text style={styles.gridLabel}>Leaderboard</Text>
            <Text style={styles.gridSub}>Coding ranks & metrics</Text>
          </View>

          {/* Module 6: AI Assistant */}
          <View style={styles.gridItemFull}>
            <View style={[styles.gridIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
              <MessageSquare size={24} color="#8B5CF6" />
            </View>
            <View style={styles.gridItemFullText}>
              <Text style={styles.gridLabel}>AI Assistant</Text>
              <Text style={styles.gridSub}>Chat dynamically with LangChain RAG pipeline</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D1A',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 14,
  },
  welcome: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 2,
    letterSpacing: 1,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cardBody: {},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  gridItemFull: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  gridItemFullText: {
    marginLeft: 14,
    flex: 1,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
