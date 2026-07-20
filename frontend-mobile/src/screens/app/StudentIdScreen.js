import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  CreditCard,
  QrCode,
  DollarSign,
  Plus,
  WifiOff,
  Wifi,
  X,
  TrendingDown,
  TrendingUp,
  User,
  Shield,
  Smartphone,
  RefreshCw,
} from "lucide-react-native";
import {
  fetchStudentCard,
  topupStudentWallet,
  fetchWalletTransactions,
} from "../../redux/slices/studentIdSlice";

const { width } = Dimensions.get("window");

export default function StudentIdScreen() {
  const dispatch = useDispatch();

  // Redux selectors
  const { card = null, transactions = [], isLoading = false, submitting = false } = useSelector((state) => state.studentId || {});
  const { user = {}, profile = {} } = useSelector((state) => state.auth || {});

  // UI state
  const [isFlipped, setIsFlipped] = useState(false);
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Load card details & transactions
  useEffect(() => {
    dispatch(fetchStudentCard());
    dispatch(fetchWalletTransactions());
  }, [dispatch, isSimulatedOffline]);

  const handleTopup = () => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "Wallet deposits/top-ups are disabled while offline.");
      return;
    }

    const amt = Number(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please input a positive numeric deposit amount.");
      return;
    }

    dispatch(topupStudentWallet(amt))
      .unwrap()
      .then((updatedCard) => {
        setTopupModalVisible(false);
        setTopupAmount("");
        Alert.alert("Success", `₹${amt} added successfully to your campus wallet!`);
        dispatch(fetchWalletTransactions());
      })
      .catch((err) => {
        Alert.alert("Top-up failed", err);
      });
  };

  const getTxTypeDetails = (type) => {
    switch (type) {
      case "credit":
        return {
          icon: <TrendingUp size={16} color="#10B981" />,
          color: "#10B981",
          prefix: "+",
        };
      case "debit":
        default:
        return {
          icon: <TrendingDown size={16} color="#EF4444" />,
          color: "#EF4444",
          prefix: "-",
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      {isSimulatedOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#EF4444" />
          <Text style={styles.offlineBannerText}>
            Offline Mode Active (Showing Cached ID & Wallet)
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Digital Student ID</Text>
          <Text style={styles.headerSubtitle}>Identity card & virtual wallet</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            isSimulatedOffline ? styles.toggleBtnActive : styles.toggleBtnInactive,
          ]}
          onPress={() => setIsSimulatedOffline(!isSimulatedOffline)}
        >
          {isSimulatedOffline ? (
            <WifiOff size={16} color="#EF4444" />
          ) : (
            <Wifi size={16} color="#10B981" />
          )}
          <Text
            style={[
              styles.toggleBtnText,
              { color: isSimulatedOffline ? "#EF4444" : "#10B981" },
            ]}
          >
            {isSimulatedOffline ? "Offline" : "Online"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Interactive ID Card Component */}
        <View style={styles.cardContainer}>
          {!isFlipped ? (
            /* Front side */
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.idCardFront}
              onPress={() => setIsFlipped(true)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardLogoContainer}>
                  <Smartphone size={20} color="#c084fc" />
                  <Text style={styles.cardLogoText}>CAMPUSONE SMART CARD</Text>
                </View>
                <View style={styles.chip} />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.avatarContainer}>
                  <User size={36} color="#1e2634" />
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.label}>NAME</Text>
                  <Text style={styles.nameText}>{user?.name || "Student Name"}</Text>

                  <Text style={styles.label}>DEPARTMENT</Text>
                  <Text style={styles.valueText}>
                    {profile?.department || "Computer Science Engineering"}
                  </Text>

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>ROLL NUMBER</Text>
                      <Text style={styles.valueText}>{profile?.rollNumber || "ROLL-000"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>SEMESTER</Text>
                      <Text style={styles.valueText}>{profile?.semester || "4"}th Sem</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>Tap to view secure access QR Code</Text>
                <QrCode size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ) : (
            /* Back side with dynamic QR payload */
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.idCardBack}
              onPress={() => setIsFlipped(false)}
            >
              <View style={styles.magneticStrip} />
              <View style={styles.qrPayloadContainer}>
                <Text style={styles.qrTitle}>SECURE GATE SCANNER</Text>
                
                <View style={styles.qrFrame}>
                  {/* Custom visual mockup block representing scanner QR */}
                  <View style={styles.qrGrid}>
                    <View style={[styles.qrCorner, styles.qrTopLeft]} />
                    <View style={[styles.qrCorner, styles.qrTopRight]} />
                    <View style={[styles.qrCorner, styles.qrBottomLeft]} />
                    
                    <QrCode size={120} color="#161f2d" />
                  </View>
                </View>

                <Text style={styles.qrTokenText} numberOfLines={1}>
                  {card?.qrToken || "Loading QR encryption token..."}
                </Text>
                <View style={styles.securityAlert}>
                  <Shield size={12} color="#10B981" />
                  <Text style={styles.securityAlertText}>
                    Updates automatically. Do not screenshot.
                  </Text>
                </View>
              </View>
              <Text style={styles.cardBackFooter}>Tap to show ID details</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Campus Wallet Segment */}
        <View style={styles.walletContainer}>
          <View style={styles.walletHeader}>
            <View style={styles.walletIconBox}>
              <CreditCard size={20} color="#161f2d" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.walletTitle}>Campus Virtual Wallet</Text>
              <Text style={styles.walletSub}>Spend at library & canteen</Text>
            </View>
            <TouchableOpacity
              style={styles.topupBtn}
              onPress={() => setTopupModalVisible(true)}
            >
              <Plus size={16} color="#161f2d" style={{ marginRight: 4 }} />
              <Text style={styles.topupBtnText}>Top Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            {isLoading && !card ? (
              <ActivityIndicator size="small" color="#c084fc" />
            ) : (
              <Text style={styles.balanceValue}>₹{card?.walletBalance?.toFixed(2) || "0.00"}</Text>
            )}
          </View>
        </View>

        {/* Transaction History Ledger */}
        <View style={styles.ledgerSection}>
          <Text style={styles.ledgerHeader}>Recent Wallet Transactions</Text>

          {isLoading && transactions.length === 0 ? (
            <ActivityIndicator size="large" color="#c084fc" style={{ marginTop: 20 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyLedger}>
              <RefreshCw size={24} color="#6B7280" />
              <Text style={styles.emptyText}>No recent transactions recorded</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const txStyle = getTxTypeDetails(item.type);
                const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <View style={styles.txRow}>
                    <View style={[styles.txIconBox, { backgroundColor: `${txStyle.color}1c` }]}>
                      {txStyle.icon}
                    </View>
                    <View style={styles.txMeta}>
                      <Text style={styles.txDesc}>{item.description}</Text>
                      <Text style={styles.txDate}>{dateStr}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: txStyle.color }]}>
                      {txStyle.prefix}₹{item.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              }}
            />
          )}
        </View>
      </ScrollView>

      {/* Top up Modal Balance Form */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={topupModalVisible}
        onRequestClose={() => setTopupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Campus Wallet</Text>
              <TouchableOpacity onPress={() => setTopupModalVisible(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Deposit Amount (₹)</Text>
            <TextInput
              style={styles.topupInput}
              placeholder="e.g. 500"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
              value={topupAmount}
              onChangeText={setTopupAmount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setTopupModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleTopup}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#161f2d" />
                ) : (
                  <Text style={styles.confirmBtnText}>Pay & Add</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#161f2d",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(239, 68, 68, 0.24)",
  },
  offlineBannerText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  toggleBtnInactive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  toggleBtnText: {
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  cardContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  idCardFront: {
    width: "100%",
    height: 220,
    backgroundColor: "#1e2634",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    padding: 20,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLogoText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 8,
    letterSpacing: 1,
  },
  chip: {
    width: 32,
    height: 24,
    backgroundColor: "#F59E0B",
    borderRadius: 4,
    opacity: 0.8,
  },
  cardBody: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 75,
    borderRadius: 8,
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  label: {
    color: "#6B7280",
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  valueText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    paddingTop: 12,
  },
  cardFooterText: {
    color: "#6B7280",
    fontSize: 10,
  },
  idCardBack: {
    width: "100%",
    height: 220,
    backgroundColor: "#1e2634",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  magneticStrip: {
    width: "100%",
    height: 32,
    backgroundColor: "#161f2d",
    marginTop: 6,
  },
  qrPayloadContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  qrTitle: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  qrFrame: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  qrGrid: {
    position: "relative",
  },
  qrCorner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: "#161f2d",
    borderWidth: 3,
  },
  qrTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  qrTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  qrBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  qrTokenText: {
    color: "#6B7280",
    fontSize: 8,
    width: 200,
    textAlign: "center",
  },
  securityAlert: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  securityAlertText: {
    color: "#10B981",
    fontSize: 8,
    marginLeft: 4,
    fontWeight: "600",
  },
  cardBackFooter: {
    color: "#6B7280",
    fontSize: 9,
  },
  walletContainer: {
    backgroundColor: "#1e2634",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 20,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingBottom: 12,
    marginBottom: 12,
  },
  walletIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  walletTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  walletSub: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 1,
  },
  topupBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c084fc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topupBtnText: {
    color: "#161f2d",
    fontSize: 11,
    fontWeight: "bold",
  },
  balanceBox: {
    paddingVertical: 4,
  },
  balanceLabel: {
    color: "#6B7280",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },
  ledgerSection: {
    marginHorizontal: 16,
  },
  ledgerHeader: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyLedger: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    backgroundColor: "#1e2634",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#232e41",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 8,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e2634",
    borderWidth: 1,
    borderColor: "#232e41",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  txMeta: {
    marginLeft: 12,
    flex: 1,
  },
  txDesc: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  txDate: {
    color: "#9CA3AF",
    fontSize: 9,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1e2634",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 16,
    padding: 20,
    width: width * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalLabel: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  topupInput: {
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 15,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelBtn: {
    width: "35%",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#232e41",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  confirmBtn: {
    width: "60%",
    backgroundColor: "#c084fc",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    color: "#161f2d",
    fontSize: 12,
    fontWeight: "600",
  },
});
