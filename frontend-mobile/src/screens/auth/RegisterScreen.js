import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react-native';
import { registerUser, clearError } from '../../redux/slices/authSlice';

export default function RegisterScreen({ route, navigation }) {
  const selectedRole = route.params?.selectedRole || 'student';
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student Fields
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [batch, setBatch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // Faculty Fields
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleRegister = () => {
    // Basic verification
    if (!name.trim() || !email.trim() || !password.trim()) {
      return;
    }

    const payload = {
      name,
      email,
      password,
      role: selectedRole,
    };

    if (selectedRole === 'student') {
      payload.rollNumber = rollNumber;
      payload.department = department;
      payload.semester = semester;
      payload.batch = batch;
      payload.phoneNumber = phoneNumber;
      payload.parentPhoneNumber = parentPhoneNumber;
      payload.address = address;
    } else if (selectedRole === 'faculty') {
      payload.employeeId = employeeId;
      payload.department = department;
      payload.designation = designation;
      payload.phoneNumber = phoneNumber;
    }

    dispatch(registerUser(payload));
  };

  const getRoleHeaderColor = () => {
    switch (selectedRole) {
      case 'faculty':
        return '#10B981'; // Emerald
      default:
        return '#6366F1'; // Indigo (Student)
    }
  };

  const themeColor = getRoleHeaderColor();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appTitle}>Create Account</Text>
            <Text style={styles.subtitle}>Register as a CampusOne {selectedRole}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Common Inputs */}
            <Text style={styles.sectionHeader}>Credentials</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#4B5563"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="email@campus.edu"
                placeholderTextColor="#4B5563"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password (min 6 chars)</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#4B5563"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Conditional Student Inputs */}
            {selectedRole === 'student' && (
              <>
                <Text style={styles.sectionHeader}>Academic Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Roll Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. CS2021005"
                    placeholderTextColor="#4B5563"
                    autoCapitalize="characters"
                    value={rollNumber}
                    onChangeText={setRollNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Department</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Computer Science"
                    placeholderTextColor="#4B5563"
                    value={department}
                    onChangeText={setDepartment}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Semester</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 5"
                      placeholderTextColor="#4B5563"
                      keyboardType="numeric"
                      value={semester}
                      onChangeText={setSemester}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Batch</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 2021-2025"
                      placeholderTextColor="#4B5563"
                      value={batch}
                      onChangeText={setBatch}
                    />
                  </View>
                </View>

                <Text style={styles.sectionHeader}>Contact Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor="#4B5563"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Parent's Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+1 234 567 8901"
                    placeholderTextColor="#4B5563"
                    keyboardType="phone-pad"
                    value={parentPhoneNumber}
                    onChangeText={setParentPhoneNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Residential Address</Text>
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Enter full address"
                    placeholderTextColor="#4B5563"
                    multiline
                    numberOfLines={3}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>
              </>
            )}

            {/* Conditional Faculty Inputs */}
            {selectedRole === 'faculty' && (
              <>
                <Text style={styles.sectionHeader}>Academic Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Employee ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. FAC201901"
                    placeholderTextColor="#4B5563"
                    autoCapitalize="characters"
                    value={employeeId}
                    onChangeText={setEmployeeId}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Department</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Information Technology"
                    placeholderTextColor="#4B5563"
                    value={department}
                    onChangeText={setDepartment}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Designation</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Associate Professor"
                    placeholderTextColor="#4B5563"
                    value={designation}
                    onChangeText={setDesignation}
                  />
                </View>

                <Text style={styles.sectionHeader}>Contact Information</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+1 234 567 8900"
                    placeholderTextColor="#4B5563"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: themeColor }]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signInRedirect}>
              <Text style={styles.signInLabel}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login', { selectedRole })} activeOpacity={0.7}>
                <Text style={[styles.signInLink, { color: themeColor }]}>Log In</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D1A',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#8A99AD',
    marginTop: 6,
  },
  form: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionHeader: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingBottom: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#090D1A',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  signInRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInLabel: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  signInLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});
