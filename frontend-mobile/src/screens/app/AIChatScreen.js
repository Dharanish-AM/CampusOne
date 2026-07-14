import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { Bot, Send, Trash2, Sparkles, RefreshCw } from "lucide-react-native";
import {
  sendMessage,
  loadHistory,
  clearChat,
  clearChatError,
  addOptimisticMessage,
} from "../../redux/slices/chatSlice";

// ── Suggested prompts shown on a fresh conversation ──────────────────────────
const SUGGESTED_PROMPTS = [
  "What is my current attendance percentage?",
  "What classes do I have today?",
  "What happens if attendance drops below 75%?",
  "How is the coding leaderboard score calculated?",
  "When does the bus arrive?",
  "How do I apply for medical leave?",
];

// ── Typing indicator (three animated dots) ────────────────────────────────────
const TypingIndicator = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 180),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingBubble}>
      <View style={styles.botAvatarSmall}>
        <Bot size={12} color="#c084fc" />
      </View>
      <View style={styles.typingDots}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dot,
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ── Simple inline markdown parser (bold, code, bullets) ───────────────────────
const renderContent = (text) => {
  // Split on code blocks first
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={i} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    // Bold **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith("**") && bp.endsWith("**")) {
        return (
          <Text key={`${i}_${j}`} style={styles.boldText}>
            {bp.slice(2, -2)}
          </Text>
        );
      }
      return (
        <Text key={`${i}_${j}`} style={styles.messageText}>
          {bp}
        </Text>
      );
    });
  });
};

// ── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAssistant,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.botAvatar}>
          <Bot size={14} color="#c084fc" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
          {renderContent(message.content)}
        </Text>
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </Text>
      </View>
    </Animated.View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AIChatScreen() {
  const dispatch = useDispatch();
  const { messages, status, conversationId, error } = useSelector(
    (s) => s.chat,
  );

  const [inputText, setInputText] = useState("");
  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputRef = useRef(null);

  const isLoading = status === "loading";
  const isEmpty = messages.length === 0;

  // Pulsing avatar glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages, isLoading]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearChatError());
    };
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const trimmed = (text || inputText).trim();
      if (!trimmed || isLoading) return;

      setInputText("");
      Keyboard.dismiss();

      // Optimistic user bubble
      const optimisticMsg = {
        id: `${Date.now()}_user`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
        optimistic: true,
      };
      dispatch(addOptimisticMessage(optimisticMsg));

      dispatch(sendMessage({ message: trimmed, conversationId }));
    },
    [inputText, isLoading, conversationId, dispatch],
  );

  const handleClear = useCallback(() => {
    dispatch(clearChat());
  }, [dispatch]);

  const handleSuggestedPrompt = useCallback(
    (prompt) => {
      handleSend(prompt);
    },
    [handleSend],
  );

  // Memoised data array — append typing indicator as a sentinel item
  const listData = useMemo(() => {
    const items = [...messages];
    if (isLoading) items.push({ id: "__typing__", role: "__typing__" });
    return items;
  }, [messages, isLoading]);

  const renderItem = useCallback(({ item }) => {
    if (item.role === "__typing__") return <TypingIndicator />;
    return <MessageBubble message={item} />;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View
            style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]}
          >
            <View style={styles.avatar}>
              <Bot size={20} color="#6366F1" />
            </View>
          </Animated.View>
          <View>
            <Text style={styles.headerTitle}>CampusBot</Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.statusDot, { backgroundColor: "#4ADE80" }]}
              />
              <Text style={styles.statusText}>
                AI Assistant · Powered by Ollama
              </Text>
            </View>
          </View>
        </View>
        {!isEmpty && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearBtn}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Messages or Empty State ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {isEmpty ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome */}
            <View style={styles.welcomeCard}>
              <Sparkles
                size={28}
                color="#6366F1"
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.welcomeTitle}>How can I help you?</Text>
              <Text style={styles.welcomeSubtitle}>
                Ask me anything about your attendance, timetable, bus schedule,
                campus policies, or coding leaderboard.
              </Text>
            </View>

            {/* Suggested prompts */}
            <Text style={styles.suggestedLabel}>Suggested questions</Text>
            <View style={styles.suggestedGrid}>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestedChip}
                  onPress={() => handleSuggestedPrompt(prompt)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.suggestedText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* ── Error Banner ── */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => dispatch(clearChatError())}>
              <RefreshCw size={14} color="#F87171" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Input Bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask CampusBot anything…"
            placeholderTextColor="#4B5563"
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#080C18" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(99,102,241,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: "#6B7280", fontSize: 11 },
  clearBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#161f2d",
  },

  // Empty state
  emptyContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  welcomeCard: {
    backgroundColor: "#161f2d",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.2)",
    marginBottom: 28,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  welcomeSubtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  suggestedLabel: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  suggestedGrid: { gap: 8 },
  suggestedChip: {
    backgroundColor: "#161f2d",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1e2634",
  },
  suggestedText: { color: "#D1D5DB", fontSize: 14, lineHeight: 20 },

  // Messages
  listContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 8 },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowUser: { justifyContent: "flex-end" },
  messageRowAssistant: { justifyContent: "flex-start" },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.3)",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: "#c084fc",
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#161f2d",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#1e2634",
  },
  messageText: {
    color: "#E5E7EB",
    fontSize: 14,
    lineHeight: 22,
  },
  messageTextUser: { color: "#0f172a" },
  boldText: { fontWeight: "700", color: "#FFFFFF" },
  inlineCode: {
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    color: "#d8b4fe",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  timestamp: {
    color: "rgba(156,163,175,0.6)",
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timestampUser: { color: "rgba(15, 23, 42, 0.5)" },

  // Typing indicator
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  botAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(192, 132, 252, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#161f2d",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1e2634",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#c084fc",
  },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  errorText: { color: "#F87171", fontSize: 13, flex: 1, marginRight: 8 },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#1e2634",
    backgroundColor: "#0f172a",
  },
  input: {
    flex: 1,
    backgroundColor: "#161f2d",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#1e2634",
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#1e2634",
    opacity: 0.5,
  },
});
