import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  MapPin,
  Trophy,
  MessageSquare,
  CreditCard,
  Coffee,
  Tag,
  Users,
  GraduationCap,
  Archive,
} from "lucide-react-native";

import { createStackNavigator } from "@react-navigation/stack";

import DashboardScreen from "../screens/app/DashboardScreen";
import AttendanceScreen from "../screens/app/AttendanceScreen";
import TimetableScreen from "../screens/app/TimetableScreen";
import BusTrackingScreen from "../screens/app/BusTrackingScreen";
import LeaderboardScreen from "../screens/app/LeaderboardScreen";
import AIChatScreen from "../screens/app/AIChatScreen";
import ComplaintScreen from "../screens/app/ComplaintScreen";
import PlacementScreen from "../screens/app/PlacementScreen";
import HostelScreen from "../screens/app/HostelScreen";
import LibraryScreen from "../screens/app/LibraryScreen";
import FeesScreen from "../screens/app/FeesScreen";
import CafeteriaScreen from "../screens/app/CafeteriaScreen";
import MarketplaceScreen from "../screens/app/MarketplaceScreen";
import ClubsScreen from "../screens/app/ClubsScreen";
import AlumniScreen from "../screens/app/AlumniScreen";
import StudentIdScreen from "../screens/app/StudentIdScreen";
import LostFoundScreen from "../screens/app/LostFoundScreen";

const Tab = createBottomTabNavigator();
const DashboardStack = createStackNavigator();

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} />
      <DashboardStack.Screen name="Complaint" component={ComplaintScreen} />
      <DashboardStack.Screen name="Placement" component={PlacementScreen} />
      <DashboardStack.Screen name="Hostel" component={HostelScreen} />
      <DashboardStack.Screen name="Library" component={LibraryScreen} />
    </DashboardStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#c084fc", // Glowing Lavender Accent
        tabBarInactiveTintColor: "#94a3b8", // Cool Slate Gray
        tabBarStyle: {
          backgroundColor: "#161f2d", // Slate Surface
          borderTopColor: "#1e2634", // Subtle Border
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 85 : 62,
          paddingBottom: Platform.OS === "ios" ? 24 : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 8.5,
          fontWeight: "600",
          marginBottom: Platform.OS === "web" ? 4 : 2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Timetable"
        component={TimetableScreen}
        options={{
          tabBarLabel: "Timetable",
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Bus"
        component={BusTrackingScreen}
        options={{
          tabBarLabel: "Bus",
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: "Leaderboard",
          tabBarIcon: ({ color, size }) => <Trophy size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          tabBarLabel: "AI Chat",
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Fees"
        component={FeesScreen}
        options={{
          tabBarLabel: "Fees",
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Canteen"
        component={CafeteriaScreen}
        options={{
          tabBarLabel: "Canteen",
          tabBarIcon: ({ color, size }) => (
            <Coffee size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Store"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: "Store",
          tabBarIcon: ({ color, size }) => (
            <Tag size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Clubs"
        component={ClubsScreen}
        options={{
          tabBarLabel: "Clubs",
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Alumni"
        component={AlumniScreen}
        options={{
          tabBarLabel: "Alumni",
          tabBarIcon: ({ color, size }) => (
            <GraduationCap size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DigitalID"
        component={StudentIdScreen}
        options={{
          tabBarLabel: "Digital ID",
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LostFound"
        component={LostFoundScreen}
        options={{
          tabBarLabel: "Lost & Found",
          tabBarIcon: ({ color, size }) => (
            <Archive size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
