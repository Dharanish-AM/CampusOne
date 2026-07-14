import React from "react";
import * as RN from "react-native";

const resolveFontFamily = (stylesArray) => {
  const flatStyle = RN.StyleSheet.flatten(stylesArray) || {};
  let fontFamily = flatStyle.fontFamily;
  const fontWeight = flatStyle.fontWeight;
  
  if (!fontFamily) {
    fontFamily = "SpaceGrotesk";
  }
  
  let resolvedFont = "SpaceGrotesk_400Regular";
  
  if (fontFamily === "SpaceGrotesk") {
    if (fontWeight === "bold" || fontWeight === "700" || fontWeight === "800" || fontWeight === "900") {
      resolvedFont = "SpaceGrotesk_700Bold";
    } else if (fontWeight === "600" || fontWeight === "500") {
      resolvedFont = "SpaceGrotesk_600SemiBold";
    } else {
      resolvedFont = "SpaceGrotesk_400Regular";
    }
  } else if (fontFamily === "Fraunces") {
    if (fontWeight === "bold" || fontWeight === "700" || fontWeight === "800" || fontWeight === "900") {
      resolvedFont = "Fraunces_700Bold";
    } else if (fontWeight === "600" || fontWeight === "500") {
      resolvedFont = "Fraunces_600SemiBold";
    } else {
      resolvedFont = "Fraunces_400Regular";
    }
  } else {
    resolvedFont = fontFamily;
  }
  
  return resolvedFont;
};

// ── Global Monkey-Patching for Custom Fonts in React Native ───────────────────
const OriginalText = RN.Text;
const OriginalTextInput = RN.TextInput;

// Create components that wrap original ones with proper font styling
const PatchedText = React.forwardRef((props, ref) => {
  const resolvedFont = resolveFontFamily(props.style);
  const styleOverride = {
    fontFamily: resolvedFont,
    fontWeight: "normal",
  };
  return <OriginalText ref={ref} {...props} style={[props.style, styleOverride]} />;
});

const PatchedTextInput = React.forwardRef((props, ref) => {
  const resolvedFont = resolveFontFamily(props.style);
  const styleOverride = {
    fontFamily: resolvedFont,
    fontWeight: "normal",
  };
  return <OriginalTextInput ref={ref} {...props} style={[props.style, styleOverride]} />;
});

// Overwrite globally in the module registry
try {
  Object.defineProperty(RN, "Text", {
    get() {
      return PatchedText;
    },
    configurable: true,
  });
} catch (e) {
  // Web fallback: ES6 imports in react-native-web are read-only namespaces,
  // but the components themselves are mutable forwarded-ref render functions.
  if (RN.Text && typeof RN.Text === "object" && RN.Text.render) {
    const originalRender = RN.Text.render;
    RN.Text.render = function (props, ref) {
      const resolvedFont = resolveFontFamily(props.style);
      const styleOverride = {
        fontFamily: resolvedFont,
        fontWeight: "normal",
      };
      return originalRender({
        ...props,
        style: [props.style, styleOverride],
      }, ref);
    };
  }
}

try {
  Object.defineProperty(RN, "TextInput", {
    get() {
      return PatchedTextInput;
    },
    configurable: true,
  });
} catch (e) {
  if (RN.TextInput && typeof RN.TextInput === "object" && RN.TextInput.render) {
    const originalRender = RN.TextInput.render;
    RN.TextInput.render = function (props, ref) {
      const resolvedFont = resolveFontFamily(props.style);
      const styleOverride = {
        fontFamily: resolvedFont,
        fontWeight: "normal",
      };
      return originalRender({
        ...props,
        style: [props.style, styleOverride],
      }, ref);
    };
  }
}
