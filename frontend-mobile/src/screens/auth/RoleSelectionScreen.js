import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import {
  GraduationCap,
  User,
  ShieldAlert,
  ArrowRight,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function RoleSelectionScreen({ navigation }) {
  const roles = [
    {
      id: "student",
      title: "Student Portal",
      description:
        "Check attendance, timetable, bus coordinates, leaderboard, and chat with AI.",
      icon: GraduationCap,
      color: "#c084fc", // Lavender glow
    },
    {
      id: "faculty",
      title: "Faculty Portal",
      description:
        "Manage attendance, update class schedules, and review student rosters.",
      icon: User,
      color: "#10B981", // Emerald glow
    },
    {
      id: "admin",
      title: "Administration",
      description:
        "Campus configurations, role assignments, notifications, and security logs.",
      icon: ShieldAlert,
      color: "#F59E0B", // Amber glow
    },
  ];

  const handleSelectRole = (roleId) => {
    navigation.navigate("Login", { selectedRole: roleId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CampusOne</Text>
        <Text style={styles.subtitle}>Select your entry portal to proceed</Text>
      </View>

      <View style={styles.list}>
        {roles.map((item) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[styles.card, { borderColor: `${item.color}30` }]}
              onPress={() => handleSelectRole(item.id)}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: `${item.color}15` },
                ]}
              >
                <IconComponent size={28} color={item.color} />
              </View>

              <View style={styles.textWrapper}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>

              <View style={styles.arrowWrapper}>
                <ArrowRight size={20} color="#4B5563" />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by CampusOne Smart Systems
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a", // Dark slate background
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    ...Platform.select({
      web: {
        textShadow: "0px 4px 10px rgba(192, 132, 252, 0.4)",
      },
      default: {
        textShadowColor: "rgba(192, 132, 252, 0.4)",
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
      },
    }),
  },
  subtitle: {
    fontSize: 15,
    color: "#8A99AD",
    marginTop: 8,
    textAlign: "center",
  },
  list: {
    flex: 1,
    justifyContent: "center",
    marginVertical: 40,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161f2d",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
      },
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  iconWrapper: {
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  textWrapper: {
    flex: 1,
    marginLeft: 16,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardDescription: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    lineHeight: 18,
  },
  arrowWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    marginBottom: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#4B5563",
    letterSpacing: 0.5,
  },
});
