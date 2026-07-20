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
  Dimensions,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import {
  Coffee,
  CircleCheck,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
  Info,
  WifiOff,
  Wifi,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import {
  fetchCanteenMenu,
  placeCanteenOrder,
  fetchStudentOrdersHistory,
  addToCart,
  removeFromCart,
  clearCart,
  handleSocketOrderUpdate,
} from "../../redux/slices/cafeteriaSlice";
import { SOCKET_URL } from "../../utils/api";

const { width, height } = Dimensions.get("window");

export default function CafeteriaScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { menu, orders, cart, isLoading, submitting, error } = useSelector(
    (state) => state.cafeteria
  );
  const { profile } = useSelector((state) => state.auth);

  // Component UI State
  const [activeCategory, setActiveCategory] = useState("breakfast");
  const [viewMode, setViewMode] = useState("menu"); // 'menu' | 'history'
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Fetch menu and history on load
  useEffect(() => {
    dispatch(fetchCanteenMenu());
    dispatch(fetchStudentOrdersHistory());
  }, [dispatch, isSimulatedOffline]);

  // WebSocket Live status updates
  useEffect(() => {
    if (!profile?._id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.emit("join", `student_${profile._id}`);

    socket.on("notification:new", (data) => {
      if (data.title && data.title.includes("Canteen")) {
        console.log("Received live canteen order update:", data);
        
        // Update local Redux state immediately
        dispatch(handleSocketOrderUpdate({
          orderId: data.orderId,
          status: data.orderId ? data.message.split("now ")[1].replace("!", "") : "ready",
        }));
        
        // Show local Alert
        Alert.alert(data.title, data.message);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [profile, dispatch]);

  const handleAddToCart = (itemId) => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "Cart features are disabled while offline.");
      return;
    }
    dispatch(addToCart(itemId));
  };

  const handleRemoveFromCart = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const handlePlaceOrder = () => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "You cannot place orders while offline.");
      return;
    }
    
    // Map cart object { itemId: quantity } to API format [{ itemId, quantity }]
    const orderItems = Object.keys(cart).map((itemId) => ({
      itemId,
      quantity: cart[itemId],
    }));

    if (orderItems.length === 0) return;

    dispatch(placeCanteenOrder(orderItems))
      .unwrap()
      .then((data) => {
        setCartModalVisible(false);
        Alert.alert(
          "Order Booked!",
          `Token: ${data.pickupToken}\n\nPlease display this token at the cafeteria counter to collect your order.`
        );
        setViewMode("history");
        
        // Trigger mock status update simulator helper
        setTimeout(() => {
          triggerMockStatusTransitions(data._id, data.pickupToken);
        }, 3000);
      })
      .catch((err) => {
        Alert.alert("Order Failed", err);
      });
  };

  // Canteen Order Status Simulator helper
  const triggerMockStatusTransitions = (orderId, pickupToken) => {
    Alert.alert(
      "Simulator Alert",
      `Would you like to simulate order status transitions for "${pickupToken}"?\n(Preparing -> Ready -> Completed)`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Start",
          onPress: async () => {
            try {
              // 1. Preparing
              await fetch(`${SOCKET_URL}/api/cafeteria/order/${orderId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "preparing" }),
              });
              dispatch(fetchStudentOrdersHistory());

              // 2. Ready after 5 seconds
              setTimeout(async () => {
                await fetch(`${SOCKET_URL}/api/cafeteria/order/${orderId}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "ready" }),
                });
                dispatch(fetchStudentOrdersHistory());
              }, 5000);

              // 3. Completed after 10 seconds
              setTimeout(async () => {
                await fetch(`${SOCKET_URL}/api/cafeteria/order/${orderId}/status`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "completed" }),
                });
                dispatch(fetchStudentOrdersHistory());
              }, 12000);

            } catch (err) {
              console.warn("Failed to reach simulator webhook:", err.message);
            }
          },
        },
      ]
    );
  };

  const getCartTotals = () => {
    let count = 0;
    let sum = 0;

    Object.keys(cart).forEach((itemId) => {
      const item = menu.find((m) => m._id === itemId);
      if (item) {
        count += cart[itemId];
        sum += item.price * cart[itemId];
      }
    });

    return { count, sum };
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#94A3B8"; // Slate Gray
      case "preparing":
        return "#F59E0B"; // Orange
      case "ready":
        return "#10B981"; // Green (glowing)
      case "completed":
        return "#c084fc"; // Lavender
      case "cancelled":
        return "#EF4444"; // Red
      default:
        return "#94A3B8";
    }
  };

  const menuFiltered = menu.filter((item) => item.category === activeCategory);
  const { count: cartCount, sum: cartSum } = getCartTotals();

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      {isSimulatedOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#EF4444" />
          <Text style={styles.offlineBannerText}>
            Offline Mode Active (Showing Cached Menu)
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Smart Canteen</Text>
          <Text style={styles.headerSubtitle}>Skip queues, pre-order meals</Text>
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

      {/* Tab Switcher: Menu vs active orders */}
      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTab, viewMode === "menu" && styles.navTabActive]}
          onPress={() => setViewMode("menu")}
        >
          <Text style={[styles.navTabText, viewMode === "menu" && styles.navTabTextActive]}>
            Menu Book
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, viewMode === "history" && styles.navTabActive]}
          onPress={() => setViewMode("history")}
        >
          <Text
            style={[styles.navTabText, viewMode === "history" && styles.navTabTextActive]}
          >
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && menu.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#c084fc" />
        </View>
      ) : viewMode === "menu" ? (
        <View style={{ flex: 1 }}>
          {/* Categories Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {["breakfast", "lunch", "snacks", "dinner"].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}
                >
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Menu Items Grid */}
          <FlatList
            data={menuFiltered}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const qty = cart[item._id] || 0;
              return (
                <View style={styles.menuCard}>
                  <View style={styles.menuDetails}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.menuDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <Clock size={10} color="#9CA3AF" />
                      <Text style={styles.metaText}>{item.preparationTime} mins</Text>
                    </View>
                  </View>

                  <View style={styles.menuActionCol}>
                    <Text style={styles.menuPrice}>₹{item.price}</Text>

                    {qty > 0 ? (
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleRemoveFromCart(item._id)}
                        >
                          <Minus size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleAddToCart(item._id)}
                        >
                          <Plus size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => handleAddToCart(item._id)}
                      >
                        <Text style={styles.addBtnText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />

          {/* Floating Cart Drawer */}
          {cartCount > 0 && (
            <TouchableOpacity
              style={styles.cartDrawer}
              onPress={() => setCartModalVisible(true)}
            >
              <View style={styles.cartDrawerLeft}>
                <View style={styles.cartIconBadge}>
                  <ShoppingBag size={16} color="#161f2d" />
                  <View style={styles.badgeIndicator}>
                    <Text style={styles.indicatorText}>{cartCount}</Text>
                  </View>
                </View>
                <Text style={styles.cartDrawerItemsText}>
                  {cartCount} item{cartCount > 1 ? "s" : ""} added
                </Text>
              </View>
              <View style={styles.cartDrawerRight}>
                <Text style={styles.cartDrawerSum}>₹{cartSum}</Text>
                <ChevronRight size={16} color="#161f2d" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Order History / Tickets View */
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const statusColor = getOrderStatusColor(item.status);

            return (
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={styles.ticketToken}>{item.pickupToken}</Text>
                    <Text style={styles.ticketDate}>{dateStr}</Text>
                  </View>
                  <View
                    style={[
                      styles.ticketStatusBadge,
                      { backgroundColor: `${statusColor}1c` },
                    ]}
                  >
                    <Text style={[styles.ticketStatusText, { color: statusColor }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Items List */}
                <View style={styles.ticketBody}>
                  {item.items.map((sub, idx) => (
                    <View key={idx} style={styles.ticketItemRow}>
                      <Text style={styles.ticketItemName}>
                        {sub.itemId?.name || "Canteen Item"} x {sub.quantity}
                      </Text>
                      <Text style={styles.ticketItemPrice}>
                        ₹{((sub.itemId?.price || 0) * sub.quantity)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.ticketFooter}>
                  <Text style={styles.ticketTotalLabel}>Total Amount</Text>
                  <Text style={styles.ticketTotalVal}>₹{item.totalAmount}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Cart Items Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cartModalVisible}
        onRequestClose={() => setCartModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Canteen Cart</Text>
              <TouchableOpacity
                onPress={() => {
                  dispatch(clearCart());
                  setCartModalVisible(false);
                }}
              >
                <Text style={styles.clearCartText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cartItemsScroll}>
              {Object.keys(cart).map((itemId) => {
                const item = menu.find((m) => m._id === itemId);
                if (!item) return null;
                const qty = cart[itemId];
                return (
                  <View key={itemId} style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemPriceUnit}>₹{item.price} each</Text>
                    </View>
                    <View style={styles.qtyContainer}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleRemoveFromCart(itemId)}
                      >
                        <Minus size={10} color="#FFFFFF" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => handleAddToCart(itemId)}
                      >
                        <Plus size={10} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.checkoutFooter}>
              <View style={styles.checkoutTotalRow}>
                <Text style={styles.checkoutTotalLabel}>Total Amount Due</Text>
                <Text style={styles.checkoutTotalVal}>₹{cartSum}</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCartModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handlePlaceOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#161f2d" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Confirm Order</Text>
                  )}
                </TouchableOpacity>
              </View>
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
  navTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2634",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  navTab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  navTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#c084fc",
  },
  navTabText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  navTabTextActive: {
    color: "#c084fc",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesScroll: {
    maxHeight: 46,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: "#1e2634",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#232e41",
    marginRight: 8,
    alignSelf: "center",
  },
  chipActive: {
    borderColor: "#c084fc",
    backgroundColor: "rgba(192, 132, 252, 0.12)",
  },
  chipText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "bold",
  },
  chipTextActive: {
    color: "#c084fc",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 85, // Space for floating cart
  },
  menuCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuDetails: {
    flex: 1,
    marginRight: 12,
  },
  menuName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  menuDesc: {
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  metaText: {
    color: "#9CA3AF",
    fontSize: 10,
    marginLeft: 6,
  },
  menuActionCol: {
    alignItems: "flex-end",
    minWidth: 85,
  },
  menuPrice: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    borderWidth: 1,
    borderColor: "#c084fc",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addBtnText: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "bold",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c084fc",
    borderRadius: 6,
    padding: 2,
  },
  qtyBtn: {
    padding: 6,
  },
  qtyText: {
    color: "#161f2d",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
  },
  cartDrawer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#c084fc",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cartDrawerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartIconBadge: {
    backgroundColor: "rgba(22, 31, 45, 0.15)",
    padding: 8,
    borderRadius: 8,
    position: "relative",
  },
  badgeIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#161f2d",
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorText: {
    color: "#c084fc",
    fontSize: 8,
    fontWeight: "bold",
  },
  cartDrawerItemsText: {
    color: "#161f2d",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 12,
  },
  cartDrawerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartDrawerSum: {
    color: "#161f2d",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 6,
  },
  ticketCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 12,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingBottom: 12,
    marginBottom: 12,
  },
  ticketToken: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  ticketDate: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 4,
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketStatusText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  ticketBody: {
    marginBottom: 12,
  },
  ticketItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  ticketItemName: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  ticketItemPrice: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    paddingTop: 12,
  },
  ticketTotalLabel: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  ticketTotalVal: {
    color: "#c084fc",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1e2634",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.75,
    borderWidth: 1,
    borderColor: "#232e41",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  clearCartText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  cartItemsScroll: {
    marginBottom: 16,
  },
  cartItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a212d",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#232e41",
  },
  cartItemName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  cartItemPriceUnit: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 2,
  },
  checkoutFooter: {
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    paddingTop: 16,
  },
  checkoutTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  checkoutTotalLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  checkoutTotalVal: {
    color: "#c084fc",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelBtn: {
    width: "30%",
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
    width: "66%",
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
