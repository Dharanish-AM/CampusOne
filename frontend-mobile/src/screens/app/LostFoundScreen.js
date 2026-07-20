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
  Tag,
  Search,
  MapPin,
  Clock,
  Plus,
  WifiOff,
  Wifi,
  X,
  Mail,
  User,
  Filter,
  CircleCheck,
  CircleQuestionMark,
  Archive,
} from "lucide-react-native";
import {
  fetchLostFoundItems,
  reportLostFoundItem,
  updateLostFoundStatus,
  fetchMyListings,
} from "../../redux/slices/lostFoundSlice";

const { width } = Dimensions.get("window");

const CATEGORIES = ["all", "electronics", "documents", "keys", "clothing", "other"];

export default function LostFoundScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { listings = [], myListings = [], isLoading = false, submitting = false } = useSelector((state) => state.lostFound || {});
  const { user = {} } = useSelector((state) => state.auth || {});

  // Component UI State
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'my'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterType, setFilterType] = useState("lost"); // 'lost' | 'found'
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Modal form states
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("lost"); // 'lost' | 'found'
  const [formCategory, setFormCategory] = useState("electronics");
  const [formLocation, setFormLocation] = useState("");

  // Fetch items feed
  useEffect(() => {
    dispatch(
      fetchLostFoundItems({
        q: searchQuery,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        type: filterType,
      })
    );
  }, [dispatch, searchQuery, selectedCategory, filterType, isSimulatedOffline]);

  // Fetch my listings
  useEffect(() => {
    if (activeTab === "my") {
      dispatch(fetchMyListings());
    }
  }, [dispatch, activeTab]);

  const handleCreateReport = () => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "Reporting items is disabled while offline.");
      return;
    }

    if (!formTitle || !formDescription || !formLocation) {
      Alert.alert("Missing Fields", "Please populate the item title, description, and location.");
      return;
    }

    dispatch(
      reportLostFoundItem({
        title: formTitle,
        description: formDescription,
        type: formType,
        category: formCategory,
        location: formLocation,
      })
    )
      .unwrap()
      .then(() => {
        setReportModalVisible(false);
        setFormTitle("");
        setFormDescription("");
        setFormLocation("");
        Alert.alert("Report Submitted", "Your Lost & Found item listing has been registered.");
        setActiveTab("my");
      })
      .catch((err) => {
        Alert.alert("Submission failed", err);
      });
  };

  const handleUpdateStatus = (itemId, currentStatus) => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "Updating listing status is disabled while offline.");
      return;
    }

    const nextStatus = currentStatus === "open" ? "resolved" : "open";
    const statusLabel = nextStatus === "resolved" ? "Mark as Resolved/Claimed" : "Re-open listing";

    Alert.alert(statusLabel, `Are you sure you want to update this item status to ${nextStatus.toUpperCase()}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: () => {
          dispatch(updateLostFoundStatus({ itemId, status: nextStatus }))
            .unwrap()
            .then(() => {
              Alert.alert("Status Updated", `Item status is now ${nextStatus.toUpperCase()}`);
              if (activeTab === "my") {
                dispatch(fetchMyListings());
              }
            });
        },
      },
    ]);
  };

  const handleContactReporter = (item) => {
    const email = item.reporterId?.email || "help@campusone.edu";
    const name = item.reporterId?.name || "Reporter";
    Alert.alert(
      "Contact Info",
      `Reporter: ${name}\nEmail: ${email}\n\nWould you like to compose an email inquiry?`,
      [
        { text: "Dismiss", style: "cancel" },
        { text: "Send Email", onPress: () => {} }, // standard mock callback
      ]
    );
  };

  const getItemCategoryColor = (cat) => {
    switch (cat) {
      case "electronics":
        return "#A78BFA"; // Violet
      case "documents":
        return "#60A5FA"; // Blue
      case "keys":
        return "#FBBF24"; // Amber
      case "clothing":
        return "#34D399"; // Green
      default:
        return "#94A3B8";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      {isSimulatedOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#EF4444" />
          <Text style={styles.offlineBannerText}>
            Offline Mode Active (Showing Cached Listings)
          </Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lost & Found</Text>
          <Text style={styles.headerSubtitle}>Claim items or report found belongings</Text>
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

      {/* Tab Navigators */}
      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === "all" && styles.navTabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === "all" && styles.navTabTextActive,
            ]}
          >
            All Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, activeTab === "my" && styles.navTabActive]}
          onPress={() => setActiveTab("my")}
        >
          <Text
            style={[
              styles.navTabText,
              activeTab === "my" && styles.navTabTextActive,
            ]}
          >
            My Reports
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "all" ? (
        /* FEED VIEW */
        <View style={{ flex: 1 }}>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by keyword, location..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Type filters row */}
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                filterType === "lost" ? styles.typeBtnActive : styles.typeBtnInactive,
              ]}
              onPress={() => setFilterType("lost")}
            >
              <CircleQuestionMark size={14} color={filterType === "lost" ? "#161f2d" : "#EF4444"} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.typeBtnText,
                  { color: filterType === "lost" ? "#161f2d" : "#EF4444" },
                ]}
              >
                LOST ITEMS
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                filterType === "found" ? styles.typeBtnActive : styles.typeBtnInactive,
              ]}
              onPress={() => setFilterType("found")}
            >
              <CircleCheck size={14} color={filterType === "found" ? "#161f2d" : "#34D399"} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.typeBtnText,
                  { color: filterType === "found" ? "#161f2d" : "#34D399" },
                ]}
              >
                FOUND ITEMS
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category Chips Scroll */}
          <View style={{ marginBottom: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isLoading && listings.length === 0 ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#c084fc" />
            </View>
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const isMyItem = item.reporterId?._id === user?.id || item.reporterId === user?.id;
                const catColor = getItemCategoryColor(item.category);
                const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <View style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <View style={{ flexDirection: "row", marginTop: 4, alignItems: "center" }}>
                          <View style={[styles.catBadge, { backgroundColor: `${catColor}1c`, borderColor: `${catColor}3f` }]}>
                            <Text style={[styles.catBadgeText, { color: catColor }]}>
                              {item.category.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={styles.reportedByText}>
                            by {item.reporterId?.name || "Reporter"}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.statusBadge, item.status === "open" ? styles.statusBadgeOpen : styles.statusBadgeClosed]}>
                        <Text style={[styles.statusBadgeText, item.status === "open" ? { color: "#EF4444" } : { color: "#10B981" }]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.itemDescription}>{item.description}</Text>

                    <View style={styles.detailRow}>
                      <MapPin size={12} color="#9CA3AF" />
                      <Text style={styles.detailText}>{item.location}</Text>

                      <Clock size={12} color="#9CA3AF" style={{ marginLeft: 16 }} />
                      <Text style={styles.detailText}>{dateStr}</Text>
                    </View>

                    <View style={styles.cardFooter}>
                      {isMyItem ? (
                        <TouchableOpacity
                          style={styles.actionBtnMy}
                          onPress={() => handleUpdateStatus(item._id, item.status)}
                        >
                          <Archive size={12} color="#161f2d" style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnMyText}>
                            {item.status === "open" ? "MARK RESOLVED" : "RE-OPEN"}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.actionBtnContact}
                          onPress={() => handleContactReporter(item)}
                        >
                          <Mail size={12} color="#c084fc" style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnContactText}>CONTACT REPORTER</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      ) : (
        /* MY REPORTS LIST VIEW */
        <FlatList
          data={myListings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const catColor = getItemCategoryColor(item.category);
            const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            return (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={{ flexDirection: "row", marginTop: 4, alignItems: "center" }}>
                      <View style={[styles.catBadge, { backgroundColor: `${catColor}1c`, borderColor: `${catColor}3f` }]}>
                        <Text style={[styles.catBadgeText, { color: catColor }]}>
                          {item.category.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.typeBadge, item.type === "lost" ? styles.typeBadgeLost : styles.typeBadgeFound]}>
                        <Text style={[styles.typeBadgeText, item.type === "lost" ? { color: "#EF4444" } : { color: "#34D399" }]}>
                          {item.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, item.status === "open" ? styles.statusBadgeOpen : styles.statusBadgeClosed]}>
                    <Text style={[styles.statusBadgeText, item.status === "open" ? { color: "#EF4444" } : { color: "#10B981" }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemDescription}>{item.description}</Text>

                <View style={styles.detailRow}>
                  <MapPin size={12} color="#9CA3AF" />
                  <Text style={styles.detailText}>{item.location}</Text>

                  <Clock size={12} color="#9CA3AF" style={{ marginLeft: 16 }} />
                  <Text style={styles.detailText}>{dateStr}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.actionBtnMy}
                    onPress={() => handleUpdateStatus(item._id, item.status)}
                  >
                    <Archive size={12} color="#161f2d" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnMyText}>
                      {item.status === "open" ? "MARK RESOLVED" : "RE-OPEN"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setReportModalVisible(true)}
      >
        <Plus size={24} color="#161f2d" />
      </TouchableOpacity>

      {/* Report New Item Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Lost/Found Item</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Report Type</Text>
              <View style={styles.formTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.formTypeBtn,
                    formType === "lost" && styles.formTypeBtnActive,
                  ]}
                  onPress={() => setFormType("lost")}
                >
                  <Text style={[styles.formTypeBtnText, formType === "lost" && styles.formTypeBtnTextActive]}>
                    I LOST AN ITEM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formTypeBtn,
                    formType === "found" && styles.formTypeBtnActive,
                  ]}
                  onPress={() => setFormType("found")}
                >
                  <Text style={[styles.formTypeBtnText, formType === "found" && styles.formTypeBtnTextActive]}>
                    I FOUND AN ITEM
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Item Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Blue Nike Backpack"
                placeholderTextColor="#6B7280"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.formCategoryContainer}>
                {CATEGORIES.filter(c => c !== "all").map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.formCategoryChip,
                      formCategory === cat && styles.formCategoryChipActive,
                    ]}
                    onPress={() => setFormCategory(cat)}
                  >
                    <Text style={[styles.formCategoryChipText, formCategory === cat && styles.formCategoryChipTextActive]}>
                      {cat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Lost/Found Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Physics Department Room 204"
                placeholderTextColor="#6B7280"
                value={formLocation}
                onChangeText={setFormLocation}
              />

              <Text style={styles.label}>Item Description & Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Please describe identifying marks, brand names, contents inside, and instructions on how the owner can prove ownership..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                value={formDescription}
                onChangeText={setFormDescription}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => setReportModalVisible(false)}
                >
                  <Text style={styles.formCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.formSubmitBtn}
                  onPress={handleCreateReport}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#161f2d" />
                  ) : (
                    <Text style={styles.formSubmitBtnText}>Submit Listing</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    marginBottom: 16,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e2634",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
  },
  typeSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  typeBtn: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeBtnActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  typeBtnInactive: {
    backgroundColor: "#1e2634",
    borderColor: "#232e41",
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: "#232e41",
    backgroundColor: "#1e2634",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  categoryChipText: {
    color: "#9CA3AF",
    fontSize: 9,
    fontWeight: "bold",
  },
  categoryChipTextActive: {
    color: "#161f2d",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  itemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  reportedByText: {
    color: "#6B7280",
    fontSize: 10,
    marginLeft: 8,
  },
  catBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  typeBadgeLost: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  typeBadgeFound: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeOpen: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  statusBadgeClosed: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  itemDescription: {
    color: "#D1D5DB",
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  detailText: {
    color: "#9CA3AF",
    fontSize: 11,
    marginLeft: 4,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#232e41",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionBtnContact: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c084fc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnContactText: {
    color: "#c084fc",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionBtnMy: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c084fc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnMyText: {
    color: "#161f2d",
    fontSize: 10,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#c084fc",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
    maxHeight: "85%",
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
  formContainer: {
    marginBottom: 10,
  },
  label: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  formTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  formTypeBtn: {
    width: "48%",
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#232e41",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a212d",
  },
  formTypeBtnActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  formTypeBtnText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "bold",
  },
  formTypeBtnTextActive: {
    color: "#161f2d",
  },
  input: {
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 13,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 14,
  },
  formCategoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  formCategoryChip: {
    borderWidth: 1,
    borderColor: "#232e41",
    backgroundColor: "#1a212d",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  formCategoryChipActive: {
    backgroundColor: "#c084fc",
    borderColor: "#c084fc",
  },
  formCategoryChipText: {
    color: "#9CA3AF",
    fontSize: 8.5,
    fontWeight: "bold",
  },
  formCategoryChipTextActive: {
    color: "#161f2d",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingBottom: 30,
  },
  formCancelBtn: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#232e41",
    alignItems: "center",
  },
  formCancelBtnText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  formSubmitBtn: {
    width: "66%",
    backgroundColor: "#c084fc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  formSubmitBtnText: {
    color: "#161f2d",
    fontSize: 13,
    fontWeight: "600",
  },
});
