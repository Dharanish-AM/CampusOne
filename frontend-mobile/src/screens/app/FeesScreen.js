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
  FlatList,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import {
  CreditCard,
  CircleCheck,
  AlertTriangle,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  WifiOff,
  Wifi,
} from "lucide-react-native";
import {
  fetchStudentInvoices,
  initiateFeePayment,
  clearFeeErrors,
  clearCheckoutData,
  handleSocketPaymentUpdate,
} from "../../redux/slices/feeSlice";
import { SOCKET_URL } from "../../utils/api";

const { width } = Dimensions.get("window");

export default function FeesScreen() {
  const dispatch = useDispatch();
  
  // Redux state
  const { invoices, isLoading, submitting, error, checkoutData } = useSelector(
    (state) => state.fees
  );
  const { profile } = useSelector((state) => state.auth);

  // Component UI State
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  
  // Offline Simulator Toggle State
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Fetch invoices on mount or when simulated network state toggles
  useEffect(() => {
    if (!isSimulatedOffline) {
      dispatch(fetchStudentInvoices());
    } else {
      // If offline, dispatch fetch thunk which will hit catch block and fall back to local AsyncStorage cache
      dispatch(fetchStudentInvoices());
    }
  }, [dispatch, isSimulatedOffline]);

  // Real-time payment notifications via Socket.IO
  useEffect(() => {
    if (!profile?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.emit("join", `student_${profile._id}`);

    socket.on("notification:new", (data) => {
      if (data.title && data.title.includes("Fee")) {
        console.log("Received live fee payment update:", data);
        
        // Update local Redux store state immediately
        dispatch(handleSocketPaymentUpdate({
          studentId: data.studentId,
          invoiceId: data.invoiceId || selectedInvoice?._id,
          amount: data.amount || selectedInvoice?.amountDue,
        }));
        
        // Show success alert
        Alert.alert("Success", data.message);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [profile, dispatch, selectedInvoice]);

  // Handle mock checkout response
  useEffect(() => {
    if (checkoutData) {
      setPaymentModalVisible(false);
      
      // Prompt user to simulate payment gateway callback webhook
      Alert.alert(
        "Payment Initiated",
        `Mock checkout created. Reference: ${checkoutData.gatewayReference}\n\nWould you like to simulate successful payment processing?`,
        [
          {
            text: "Cancel Payment",
            onPress: () => {
              // Trigger failed transaction simulation
              triggerMockWebhook(checkoutData.gatewayReference, "failed");
              dispatch(clearCheckoutData());
            },
            style: "cancel",
          },
          {
            text: "Process Success",
            onPress: () => {
              // Trigger successful transaction simulation
              triggerMockWebhook(checkoutData.gatewayReference, "success");
              dispatch(clearCheckoutData());
            },
          },
        ]
      );
    }
  }, [checkoutData, dispatch]);

  const triggerMockWebhook = async (gatewayReference, status) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/fees/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gatewayReference, status }),
      });
      const data = await response.json();
      if (data.status === "success") {
        // Fetch fresh list to align database changes
        dispatch(fetchStudentInvoices());
      }
    } catch (err) {
      console.warn("Failed to reach webhook receiver:", err.message);
    }
  };

  const handlePayPress = (invoice) => {
    if (isSimulatedOffline) {
      Alert.alert("Connection Offline", "You cannot initiate payments while offline.");
      return;
    }
    setSelectedInvoice(invoice);
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    dispatch(initiateFeePayment({ invoiceId: selectedInvoice._id, paymentMethod }));
  };

  const toggleAccordion = (id) => {
    setExpandedInvoiceId(expandedInvoiceId === id ? null : id);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Aggregated totals
  const pendingAmount = invoices
    ? invoices
        .filter((inv) => inv.status !== "paid")
        .reduce((sum, inv) => sum + (inv.amountDue - inv.amountPaid), 0)
    : 0;

  const paidAmount = invoices
    ? invoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Alert Banner */}
      {isSimulatedOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#EF4444" />
          <Text style={styles.offlineBannerText}>
            Offline Mode Active (Showing Cached Data)
          </Text>
        </View>
      )}

      {/* Header with Offline Simulator Toggle */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dues & Fees</Text>
          <Text style={styles.headerSubtitle}>Manage university billing & receipts</Text>
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

      {isLoading && invoices.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderLeftColor: "#EF4444" }]}>
              <Text style={styles.summaryLabel}>Outstanding Dues</Text>
              <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                ₹{pendingAmount.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: "#10B981" }]}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                ₹{paidAmount.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Invoices Title */}
          <Text style={styles.sectionTitle}>Invoices & Billing Statements</Text>

          {invoices.length === 0 ? (
            <View style={styles.emptyCard}>
              <CircleCheck size={32} color="#10B981" />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>
                No pending or overdue invoices found for your profile.
              </Text>
            </View>
          ) : (
            invoices.map((item) => {
              const isExpanded = expandedInvoiceId === item._id;
              const dueLeft = item.amountDue - item.amountPaid;
              const isOverdue = new Date(item.dueDate) < new Date() && item.status !== "paid";
              
              const structure = item.feeStructureId || {};

              return (
                <View key={item._id} style={styles.invoiceCard}>
                  {/* Card Header Summary */}
                  <TouchableOpacity
                    style={styles.invoiceHeader}
                    onPress={() => toggleAccordion(item._id)}
                  >
                    <View style={styles.invoiceMainInfo}>
                      <Text style={styles.invoiceTitle}>{item.title}</Text>
                      <View style={styles.dueRow}>
                        <Calendar size={12} color="#6B7280" />
                        <Text style={styles.dueText}>Due: {formatDate(item.dueDate)}</Text>
                        {isOverdue && (
                          <View style={styles.overdueBadge}>
                            <AlertTriangle size={10} color="#EF4444" />
                            <Text style={styles.overdueBadgeText}>Overdue</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.invoiceBadgeCol}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              item.status === "paid"
                                ? "rgba(16,185,129,0.12)"
                                : "rgba(239,68,68,0.12)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: item.status === "paid" ? "#10B981" : "#EF4444" },
                          ]}
                        >
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.invoiceAmount}>
                        ₹{item.amountDue.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <View style={styles.invoiceDetails}>
                      <Text style={styles.detailsTitle}>Fee breakdown</Text>
                      <View style={styles.breakdownTable}>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Tuition Fee</Text>
                          <Text style={styles.breakdownValue}>
                            ₹{(structure.tuitionFee ?? item.amountDue).toLocaleString("en-IN")}
                          </Text>
                        </View>
                        {structure.labFee > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Laboratory Fee</Text>
                            <Text style={styles.breakdownValue}>
                              ₹{structure.labFee.toLocaleString("en-IN")}
                            </Text>
                          </View>
                        )}
                        {structure.hostelFee > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Hostel Allocation Fee</Text>
                            <Text style={styles.breakdownValue}>
                              ₹{structure.hostelFee.toLocaleString("en-IN")}
                            </Text>
                          </View>
                        )}
                        {structure.examFee > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Semester Exam Fee</Text>
                            <Text style={styles.breakdownValue}>
                              ₹{structure.examFee.toLocaleString("en-IN")}
                            </Text>
                          </View>
                        )}
                        {structure.otherDues > 0 && (
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Other Miscellaneous Dues</Text>
                            <Text style={styles.breakdownValue}>
                              ₹{structure.otherDues.toLocaleString("en-IN")}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.breakdownRow, styles.totalRow]}>
                          <Text style={styles.totalLabel}>Total Statement Sum</Text>
                          <Text style={styles.totalValue}>
                            ₹{item.amountDue.toLocaleString("en-IN")}
                          </Text>
                        </View>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Amount Paid</Text>
                          <Text style={[styles.breakdownValue, { color: "#10B981" }]}>
                            ₹{item.amountPaid.toLocaleString("en-IN")}
                          </Text>
                        </View>
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Balance Outstanding</Text>
                          <Text style={[styles.breakdownValue, { color: "#EF4444" }]}>
                            ₹{dueLeft.toLocaleString("en-IN")}
                          </Text>
                        </View>
                      </View>

                      {/* Payment Action */}
                      {item.status !== "paid" && (
                        <TouchableOpacity
                          style={[
                            styles.payBtn,
                            isSimulatedOffline && styles.payBtnDisabled,
                          ]}
                          onPress={() => handlePayPress(item)}
                          disabled={isSimulatedOffline}
                        >
                          <CreditCard size={16} color="#161f2d" />
                          <Text style={styles.payBtnText}>
                            {isSimulatedOffline ? "Offline - Payment Disabled" : "Pay Outstanding Dues"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Accordion toggle indicator */}
                  <TouchableOpacity
                    style={styles.toggleIndicator}
                    onPress={() => toggleAccordion(item._id)}
                  >
                    {isExpanded ? (
                      <ChevronUp size={16} color="#6B7280" />
                    ) : (
                      <ChevronDown size={16} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Payment Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            {selectedInvoice && (
              <Text style={styles.modalSubtitle}>
                Paying for {selectedInvoice.title}
              </Text>
            )}

            <View style={styles.methodsList}>
              {["UPI", "Card", "NetBanking"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodItem,
                    paymentMethod === method && styles.methodItemActive,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <View style={styles.radioButton}>
                    {paymentMethod === method && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.methodName}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmPayment}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#161f2d" />
                ) : (
                  <Text style={styles.modalConfirmText}>Checkout</Text>
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
    backgroundColor: "#161f2d", // Primary slate background
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#232e41",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
  emptyCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#232e41",
    marginTop: 12,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  invoiceCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 12,
    overflow: "hidden",
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  invoiceMainInfo: {
    flex: 1,
    paddingRight: 12,
  },
  invoiceTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  dueText: {
    color: "#9CA3AF",
    fontSize: 11,
    marginLeft: 6,
  },
  overdueBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  overdueBadgeText: {
    color: "#EF4444",
    fontSize: 8,
    fontWeight: "bold",
    marginLeft: 2,
  },
  invoiceBadgeCol: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  invoiceAmount: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  invoiceDetails: {
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    padding: 16,
    backgroundColor: "#1a212d",
  },
  detailsTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  breakdownTable: {
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  breakdownLabel: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  breakdownValue: {
    color: "#F3F4F6",
    fontSize: 12,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingVertical: 8,
    marginVertical: 4,
  },
  totalLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  totalValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c084fc", // Lavender accent
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  payBtnDisabled: {
    backgroundColor: "#4B5563",
  },
  payBtnText: {
    color: "#161f2d",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 8,
  },
  toggleIndicator: {
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(35, 46, 65, 0.3)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1e2634",
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    borderWidth: 1,
    borderColor: "#232e41",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  methodsList: {
    marginBottom: 24,
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a212d",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#232e41",
  },
  methodItemActive: {
    borderColor: "#c084fc",
  },
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#c084fc",
  },
  methodName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelBtn: {
    width: "46%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#232e41",
    alignItems: "center",
  },
  modalCancelText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  modalConfirmBtn: {
    width: "46%",
    backgroundColor: "#c084fc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: "#161f2d",
    fontSize: 13,
    fontWeight: "600",
  },
});
