import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen,
  Search,
  BookMarked,
  DollarSign,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
} from "lucide-react-native";
import {
  searchLibraryBooks,
  fetchStudentBorrows,
  clearLibraryErrors,
} from "../../redux/slices/librarySlice";

export default function LibraryScreen() {
  const dispatch = useDispatch();

  // Redux state
  const { books, borrows, totalUnpaidFine, loading, error } = useSelector(
    (state) => state.library,
  );

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const subjectsList = [
    "All",
    "Software Engineering",
    "Computer Science",
    "Information Technology",
    "Mathematics",
  ];

  // Fetch initial borrows and catalog
  useEffect(() => {
    dispatch(fetchStudentBorrows());
    dispatch(searchLibraryBooks({}));
  }, [dispatch]);

  // Handle live search
  const handleSearch = (text) => {
    setSearchQuery(text);
    const params = {};
    if (text) params.q = text;
    if (selectedSubject && selectedSubject !== "All") {
      params.subject = selectedSubject;
    }
    dispatch(searchLibraryBooks(params));
  };

  // Handle subject filter
  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    const params = {};
    if (searchQuery) params.q = searchQuery;
    if (subject && subject !== "All") {
      params.subject = subject;
    }
    dispatch(searchLibraryBooks(params));
  };

  // Mock clear fine check
  const handleClearFine = () => {
    if (totalUnpaidFine <= 0) {
      Alert.alert("No Dues", "You do not have any pending library fines.");
      return;
    }

    Alert.alert(
      "Clear Fines",
      `Proceed to pay ₹${totalUnpaidFine} library dues?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: () => {
            Alert.alert("Success", "Library fines cleared successfully.");
            dispatch(fetchStudentBorrows());
          },
        },
      ],
    );
  };

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "overdue":
        return "#EF4444"; // Red
      case "returned":
        return "#10B981"; // Emerald
      default:
        return "#3B82F6"; // Blue
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Central Library</Text>
          <Text style={styles.headerSubtitle}>Search books & checkouts</Text>
        </View>
        <BookOpen size={24} color="#10B981" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Fine Tally Banner ── */}
        <View style={styles.fineCard}>
          <View style={styles.fineLeft}>
            <View style={styles.fineIconBg}>
              <DollarSign size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.fineLabel}>Outstanding Fine</Text>
              <Text style={styles.fineValue}>₹{totalUnpaidFine}</Text>
            </View>
          </View>
          {totalUnpaidFine > 0 && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={handleClearFine}
            >
              <Text style={styles.payButtonText}>Clear Dues</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Active Borrowed Books Section ── */}
        <View style={styles.sectionHeader}>
          <BookMarked size={16} color="#10B981" />
          <Text style={styles.sectionTitle}>My Borrowed Books</Text>
        </View>

        {borrows.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={20} color="#6B7280" />
            <Text style={styles.emptyText}>
              You have no books currently checked out.
            </Text>
          </View>
        ) : (
          borrows.map((borrow) => (
            <View key={borrow._id} style={styles.borrowCard}>
              <View style={styles.borrowHeader}>
                <Text style={styles.bookTitle}>
                  {borrow.bookId?.title || "Book Title"}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { borderColor: getStatusColor(borrow.status) },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(borrow.status) },
                    ]}
                  >
                    {borrow.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.bookAuthor}>
                by {borrow.bookId?.author || "Author"}
              </Text>

              {/* Dates Row */}
              <View style={styles.datesRow}>
                <View style={styles.dateCol}>
                  <Calendar size={12} color="#9CA3AF" />
                  <Text style={styles.dateLabel}>Borrowed: </Text>
                  <Text style={styles.dateVal}>
                    {formatDate(borrow.borrowedDate)}
                  </Text>
                </View>
                <View style={styles.dateCol}>
                  <Calendar size={12} color="#9CA3AF" />
                  <Text style={styles.dateLabel}>Due: </Text>
                  <Text
                    style={[
                      styles.dateVal,
                      borrow.status === "overdue" && {
                        color: "#EF4444",
                        fontWeight: "bold",
                      },
                    ]}
                  >
                    {formatDate(borrow.dueDate)}
                  </Text>
                </View>
              </View>

              {/* Late fine notice */}
              {borrow.status === "overdue" && (
                <View style={styles.overdueAlert}>
                  <AlertTriangle size={14} color="#EF4444" />
                  <Text style={styles.overdueAlertText}>
                    Overdue fine accumulating: ₹{borrow.fineAmount} (₹5/day)
                  </Text>
                </View>
              )}
            </View>
          ))
        )}

        {/* ── Book Catalog Explorer Section ── */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Search size={16} color="#10B981" />
          <Text style={styles.sectionTitle}>Explore Book Catalog</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or ISBN..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Subject Filter Chips */}
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {subjectsList.map((subj) => (
            <TouchableOpacity
              key={subj}
              style={[
                styles.chip,
                (selectedSubject === subj ||
                  (subj === "All" && !selectedSubject)) &&
                  styles.chipActive,
              ]}
              onPress={() => handleSelectSubject(subj === "All" ? "" : subj)}
            >
              <Text
                style={[
                  styles.chipText,
                  (selectedSubject === subj ||
                    (subj === "All" && !selectedSubject)) &&
                    styles.chipTextActive,
                ]}
              >
                {subj}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Catalog List */}
        {loading && books.length === 0 ? (
          <ActivityIndicator
            size="small"
            color="#10B981"
            style={{ marginVertical: 20 }}
          />
        ) : books.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No books found matching criteria.
            </Text>
          </View>
        ) : (
          books.map((book) => (
            <View key={book._id} style={styles.catalogCard}>
              <View style={styles.catalogInfo}>
                <Text style={styles.catalogTitle}>{book.title}</Text>
                <Text style={styles.catalogAuthor}>by {book.author}</Text>
                <View style={styles.catalogMetaRow}>
                  <Text style={styles.catalogMetaText}>
                    Subject: {book.subject}
                  </Text>
                  <Text style={styles.catalogMetaText}>ISBN: {book.isbn}</Text>
                </View>
              </View>

              <View style={styles.copiesBadgeCol}>
                <View
                  style={[
                    styles.copiesBadge,
                    {
                      backgroundColor:
                        book.availableCopies > 0
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(239,68,68,0.12)",
                    },
                  ]}
                >
                  {book.availableCopies > 0 ? (
                    <CheckCircle
                      size={10}
                      color="#10B981"
                      style={{ marginRight: 4 }}
                    />
                  ) : (
                    <AlertTriangle
                      size={10}
                      color="#EF4444"
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.copiesBadgeText,
                      {
                        color: book.availableCopies > 0 ? "#10B981" : "#EF4444",
                      },
                    ]}
                  >
                    {book.availableCopies > 0
                      ? `${book.availableCopies} available`
                      : "Out of Stock"}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1F2937",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  fineCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 20,
  },
  fineLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  fineIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245,158,11,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fineLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    textTransform: "uppercase",
  },
  fineValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  payButton: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#374151",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 6,
  },
  borrowCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  borrowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  bookAuthor: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  datesRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  dateCol: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dateLabel: {
    color: "#6B7280",
    fontSize: 11,
    marginLeft: 6,
  },
  dateVal: {
    color: "#F3F4F6",
    fontSize: 12,
  },
  overdueAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  overdueAlertText: {
    color: "#EF4444",
    fontSize: 11,
    marginLeft: 6,
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 10,
    fontSize: 14,
  },
  chipsScroll: {
    marginBottom: 16,
  },
  chip: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginRight: 8,
  },
  chipActive: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  chipText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#10B981",
  },
  catalogCard: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catalogInfo: {
    flex: 1,
    marginRight: 12,
  },
  catalogTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  catalogAuthor: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  catalogMetaRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  catalogMetaText: {
    color: "#6B7280",
    fontSize: 10,
    marginRight: 10,
  },
  copiesBadgeCol: {
    alignItems: "flex-end",
  },
  copiesBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copiesBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
