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
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  Tag,
  Plus,
  Search,
  BookOpen,
  Bicycle,
  Tv,
  Home,
  Menu,
  Phone,
  Mail,
  X,
  WifiOff,
  Wifi,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import {
  fetchMarketplaceProducts,
  postMarketplaceListing,
  fetchStudentListings,
  updateListingStatus,
} from "../../redux/slices/marketplaceSlice";

const { width } = Dimensions.get("window");

export default function MarketplaceScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { products, myListings, isLoading, submitting } = useSelector(
    (state) => state.marketplace
  );

  // Component UI State
  const [activeTab, setActiveTab] = useState("browse"); // 'browse' | 'mylistings'
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);

  // Modals state
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("textbooks");

  // Fetch catalog on load/filter
  useEffect(() => {
    dispatch(
      fetchMarketplaceProducts({
        q: searchQuery,
        category: activeCategory,
      })
    );
  }, [dispatch, searchQuery, activeCategory, isSimulatedOffline]);

  // Fetch user listings when My Listings tab selected
  useEffect(() => {
    if (activeTab === "mylistings") {
      dispatch(fetchStudentListings());
    }
  }, [dispatch, activeTab]);

  const handlePostListing = () => {
    if (isSimulatedOffline) {
      Alert.alert("Offline Mode", "You cannot post new listings while offline.");
      return;
    }

    if (!formTitle.trim() || !formDescription.trim() || !formPrice.trim()) {
      Alert.alert("Error", "Please fill in all listing details.");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Error", "Please enter a valid price.");
      return;
    }

    dispatch(
      postMarketplaceListing({
        title: formTitle,
        description: formDescription,
        price: priceNum,
        category: formCategory,
      })
    )
      .unwrap()
      .then(() => {
        setSellModalVisible(false);
        // Reset form
        setFormTitle("");
        setFormDescription("");
        setFormPrice("");
        setFormCategory("textbooks");
        Alert.alert("Success", "Your item has been listed successfully!");
        setActiveTab("mylistings");
      })
      .catch((err) => {
        Alert.alert("Failed", err);
      });
  };

  const handleToggleListingStatus = (productId, currentStatus) => {
    const nextStatus = currentStatus === "available" ? "sold" : "available";
    dispatch(updateListingStatus({ productId, status: nextStatus }))
      .unwrap()
      .then(() => {
        Alert.alert("Status Updated", `Item marked as ${nextStatus}.`);
      })
      .catch((err) => {
        Alert.alert("Failed", err);
      });
  };

  const handleOpenContact = (seller, productTitle) => {
    // Check if seller structure populated correctly
    const sellerProfile = seller;
    const name = sellerProfile?.userId?.name || "Campus Student";
    const email = sellerProfile?.userId?.email || "N/A";
    const phone = sellerProfile?.phoneNumber || "N/A";
    const department = sellerProfile?.department || "General";

    setSelectedSeller({
      name,
      email,
      phone,
      department,
      productTitle,
    });
    setContactModalVisible(true);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "textbooks":
        return <BookOpen size={14} color="#c084fc" />;
      case "electronics":
        return <Tv size={14} color="#c084fc" />;
      case "cycles":
        return <Bicycle size={14} color="#c084fc" />;
      case "hostel_supplies":
        return <Home size={14} color="#c084fc" />;
      default:
        return <Tag size={14} color="#c084fc" />;
    }
  };

  const formatCategoryName = (category) => {
    return category.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
          <Text style={styles.headerTitle}>Campus Store</Text>
          <Text style={styles.headerSubtitle}>Student-to-student marketplace</Text>
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

      {/* Tab Switcher: Browse vs My Listings */}
      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === "browse" && styles.navTabActive]}
          onPress={() => setActiveTab("browse")}
        >
          <Text
            style={[styles.navTabText, activeTab === "browse" && styles.navTabTextActive]}
          >
            Browse Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, activeTab === "mylistings" && styles.navTabActive]}
          onPress={() => setActiveTab("mylistings")}
        >
          <Text
            style={[styles.navTabText, activeTab === "mylistings" && styles.navTabTextActive]}
          >
            My Listings
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "browse" ? (
        <View style={{ flex: 1 }}>
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search textbooks, electronics, cycles..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categories Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {[
              { id: "all", label: "ALL" },
              { id: "textbooks", label: "BOOKS" },
              { id: "electronics", label: "DEVICES" },
              { id: "cycles", label: "CYCLES" },
              { id: "hostel_supplies", label: "HOSTEL" },
              { id: "others", label: "OTHERS" },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, activeCategory === cat.id && styles.chipActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text
                  style={[styles.chipText, activeCategory === cat.id && styles.chipTextActive]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoading && products.length === 0 ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#c084fc" />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              renderItem={({ item }) => (
                <View style={styles.productCard}>
                  <Image source={{ uri: item.images[0] }} style={styles.productImg} />
                  <View style={styles.productMeta}>
                    <View style={styles.categoryBadge}>
                      {getCategoryIcon(item.category)}
                      <Text style={styles.categoryBadgeText}>
                        {formatCategoryName(item.category)}
                      </Text>
                    </View>
                    <Text style={styles.productTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.productDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={styles.productPrice}>₹{item.price}</Text>

                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => handleOpenContact(item.studentId, item.title)}
                    >
                      <Text style={styles.contactBtnText}>CONTACT SELLER</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {/* Floating Sell Action Button */}
          <TouchableOpacity
            style={styles.floatingActionBtn}
            onPress={() => setSellModalVisible(true)}
          >
            <Plus size={24} color="#161f2d" />
          </TouchableOpacity>
        </View>
      ) : (
        /* My Listings View */
        <View style={{ flex: 1 }}>
          {isLoading && myListings.length === 0 ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#c084fc" />
            </View>
          ) : (
            <FlatList
              data={myListings}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.myListContainer}
              renderItem={({ item }) => {
                const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <View style={styles.myListingCard}>
                    <Image source={{ uri: item.images[0] }} style={styles.myListingImg} />
                    <View style={styles.myListingDetails}>
                      <View style={styles.myListingHeaderRow}>
                        <Text style={styles.myListingTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            item.status === "available"
                              ? styles.statusAvailable
                              : styles.statusSold,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: item.status === "available" ? "#10B981" : "#EF4444" },
                            ]}
                          >
                            {item.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.myListingPrice}>₹{item.price}</Text>
                      <Text style={styles.myListingDate}>Posted on {dateStr}</Text>

                      <TouchableOpacity
                        style={[
                          styles.toggleStatusBtn,
                          item.status === "available" ? styles.soldBtn : styles.relistBtn,
                        ]}
                        onPress={() => handleToggleListingStatus(item._id, item.status)}
                      >
                        <Text style={styles.toggleStatusBtnText}>
                          {item.status === "available" ? "MARK AS SOLD" : "RE-LIST ITEM"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Sell Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sellModalVisible}
        onRequestClose={() => setSellModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List an Item for Sale</Text>
              <TouchableOpacity onPress={() => setSellModalVisible(false)}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Item Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hero Ranger Cycle, semester 3 textbooks"
                placeholderTextColor="#6B7280"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.label}>Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={formPrice}
                onChangeText={formPrice => setFormPrice(formPrice.replace(/[^0-9]/g, ""))}
              />

              <Text style={styles.label}>Category</Text>
              <View style={styles.dropdownContainer}>
                {[
                  { id: "textbooks", name: "Textbooks" },
                  { id: "electronics", name: "Electronics" },
                  { id: "cycles", name: "Cycles" },
                  { id: "hostel_supplies", name: "Hostel Supplies" },
                  { id: "others", name: "Others" },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.dropdownItem,
                      formCategory === cat.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => setFormCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        formCategory === cat.id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Condition, usage period, meeting point details..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                value={formDescription}
                onChangeText={setFormDescription}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => setSellModalVisible(false)}
                >
                  <Text style={styles.formCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.formSubmitBtn}
                  onPress={handlePostListing}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#161f2d" />
                  ) : (
                    <Text style={styles.formSubmitBtnText}>Post Listing</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Seller Contacts Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.contactModalContainer}>
            <View style={styles.contactHeader}>
              <Text style={styles.contactTitle} numberOfLines={1}>
                Seller Information
              </Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <X size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedSeller && (
              <View style={styles.contactBody}>
                <Text style={styles.contactItemLabel}>Item Listing</Text>
                <Text style={styles.contactItemTitle}>"{selectedSeller.productTitle}"</Text>

                <View style={styles.contactDetailRow}>
                  <TrendingUp size={16} color="#9CA3AF" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.contactDetailValue}>{selectedSeller.name}</Text>
                    <Text style={styles.contactDetailSub}>{selectedSeller.department} Dept</Text>
                  </View>
                </View>

                <View style={styles.contactDetailRow}>
                  <Phone size={16} color="#c084fc" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.contactDetailValue}>{selectedSeller.phone}</Text>
                    <Text style={styles.contactDetailSub}>Tap to call seller</Text>
                  </View>
                </View>

                <View style={styles.contactDetailRow}>
                  <Mail size={16} color="#c084fc" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.contactDetailValue}>{selectedSeller.email}</Text>
                    <Text style={styles.contactDetailSub}>Tap to email seller</Text>
                  </View>
                </View>
              </View>
            )}
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
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 85,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  productCard: {
    backgroundColor: "#1e2634",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#232e41",
    width: "48%",
    marginBottom: 12,
    overflow: "hidden",
  },
  productImg: {
    width: "100%",
    height: 110,
    backgroundColor: "#161f2d",
  },
  productMeta: {
    padding: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(192, 132, 252, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.2)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  categoryBadgeText: {
    color: "#c084fc",
    fontSize: 8,
    fontWeight: "bold",
    marginLeft: 4,
  },
  productTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  productDesc: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  productPrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  contactBtn: {
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    borderWidth: 1,
    borderColor: "#c084fc",
    borderRadius: 6,
    alignItems: "center",
    paddingVertical: 6,
    marginTop: 8,
  },
  contactBtnText: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: "bold",
  },
  floatingActionBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#c084fc",
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  myListContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  myListingCard: {
    flexDirection: "row",
    backgroundColor: "#1e2634",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#232e41",
    padding: 12,
    marginBottom: 10,
  },
  myListingImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#161f2d",
  },
  myListingDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  myListingHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  myListingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusAvailable: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  statusSold: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  myListingPrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  myListingDate: {
    color: "#9CA3AF",
    fontSize: 10,
  },
  toggleStatusBtn: {
    borderRadius: 6,
    alignItems: "center",
    paddingVertical: 6,
    marginTop: 8,
  },
  soldBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  relistBtn: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  toggleStatusBtnText: {
    color: "#FFFFFF",
    fontSize: 9,
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  dropdownContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 14,
  },
  dropdownItem: {
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  dropdownItemActive: {
    borderColor: "#c084fc",
    backgroundColor: "rgba(192, 132, 252, 0.12)",
  },
  dropdownItemText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: "#c084fc",
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingBottom: 20,
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
  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  contactModalContainer: {
    backgroundColor: "#1e2634",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#232e41",
    width: "85%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#232e41",
    paddingBottom: 12,
    marginBottom: 14,
  },
  contactTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  contactBody: {
    marginBottom: 10,
  },
  contactItemLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
  },
  contactItemTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 2,
  },
  contactDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a212d",
    borderWidth: 1,
    borderColor: "#232e41",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  contactDetailValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  contactDetailSub: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 2,
  },
});
