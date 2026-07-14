import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { Provider, useDispatch, useSelector } from "react-redux";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as RN from "react-native";
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';

import store from "./src/redux/store";
import { loadStoredAuth } from "./src/redux/slices/authSlice";
import AuthNavigator from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";

// ── Global Monkey-Patching for Custom Fonts in React Native ───────────────────
const OriginalText = RN.Text;
const OriginalTextInput = RN.TextInput;

const resolveFontFamily = (stylesArray) => {
  const flatStyle = RN.StyleSheet.flatten(stylesArray) || {};
  let fontFamily = flatStyle.fontFamily;
  const fontWeight = flatStyle.fontWeight;
  
  if (!fontFamily) {
    fontFamily = 'SpaceGrotesk';
  }
  
  let resolvedFont = 'SpaceGrotesk_400Regular';
  
  if (fontFamily === 'SpaceGrotesk') {
    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
      resolvedFont = 'SpaceGrotesk_700Bold';
    } else if (fontWeight === '600' || fontWeight === '500') {
      resolvedFont = 'SpaceGrotesk_600SemiBold';
    } else {
      resolvedFont = 'SpaceGrotesk_400Regular';
    }
  } else if (fontFamily === 'Fraunces') {
    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
      resolvedFont = 'Fraunces_700Bold';
    } else if (fontWeight === '600' || fontWeight === '500') {
      resolvedFont = 'Fraunces_600SemiBold';
    } else {
      resolvedFont = 'Fraunces_400Regular';
    }
  } else {
    resolvedFont = fontFamily;
  }
  
  return resolvedFont;
};

// Create components that wrap original ones with proper font styling
const PatchedText = React.forwardRef((props, ref) => {
  const resolvedFont = resolveFontFamily(props.style);
  const styleOverride = {
    fontFamily: resolvedFont,
    fontWeight: 'normal',
  };
  return <OriginalText ref={ref} {...props} style={[props.style, styleOverride]} />;
});

const PatchedTextInput = React.forwardRef((props, ref) => {
  const resolvedFont = resolveFontFamily(props.style);
  const styleOverride = {
    fontFamily: resolvedFont,
    fontWeight: 'normal',
  };
  return <OriginalTextInput ref={ref} {...props} style={[props.style, styleOverride]} />;
});

// Overwrite globally in the module registry
try {
  Object.defineProperty(RN, 'Text', {
    get() {
      return PatchedText;
    },
    configurable: true,
  });
} catch (e) {
  // Web fallback: ES6 imports in react-native-web are read-only namespaces,
  // but the components themselves are mutable forwarded-ref render functions.
  if (RN.Text && typeof RN.Text === 'object' && RN.Text.render) {
    const originalRender = RN.Text.render;
    RN.Text.render = function (props, ref) {
      const resolvedFont = resolveFontFamily(props.style);
      const styleOverride = {
        fontFamily: resolvedFont,
        fontWeight: 'normal',
      };
      return originalRender({
        ...props,
        style: [props.style, styleOverride],
      }, ref);
    };
  }
}

try {
  Object.defineProperty(RN, 'TextInput', {
    get() {
      return PatchedTextInput;
    },
    configurable: true,
  });
} catch (e) {
  // Web fallback: ES6 imports in react-native-web are read-only namespaces,
  // but the components themselves are mutable forwarded-ref render functions.
  if (RN.TextInput && typeof RN.TextInput === 'object' && RN.TextInput.render) {
    const originalRender = RN.TextInput.render;
    RN.TextInput.render = function (props, ref) {
      const resolvedFont = resolveFontFamily(props.style);
      const styleOverride = {
        fontFamily: resolvedFont,
        fontWeight: 'normal',
      };
      return originalRender({
        ...props,
        style: [props.style, styleOverride],
      }, ref);
    };
  }
}

function NavigationWrapper() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#c084fc" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  if (!fontsLoaded) return null;

  // Fonts are loaded and patched globally on the module registry

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationWrapper />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: "#161f2d",
    justifyContent: "center",
    alignItems: "center",
  },
});
