import { useCallback, useRef, useState } from "react";
import { BackHandler, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { WebView, type WebViewNavigation } from "react-native-webview";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Onile is a thin native wrapper around the Onile web app (see /web in this
// repo). Change EXPO_PUBLIC_APP_URL at build time, or app.json's
// `expo.extra.appUrl`, to point at your deployed web app.
const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL ??
  (Constants.expoConfig?.extra?.appUrl as string | undefined) ??
  "http://localhost:3000";

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  const onNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack) {
        webviewRef.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {hasError ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Can&apos;t reach Onile</Text>
          <Text style={styles.errorBody}>Check your internet connection and try again.</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setHasError(false);
              webviewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ uri: APP_URL }}
          style={styles.webview}
          onNavigationStateChange={onNavigationStateChange}
          onLoadEnd={() => {
            setLoading(false);
            SplashScreen.hideAsync().catch(() => {});
          }}
          onError={() => setHasError(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) setHasError(true);
          }}
          pullToRefreshEnabled
          startInLoadingState={loading}
          sharedCookiesEnabled
          allowsBackForwardNavigationGestures
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#15803d" },
  webview: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f9fafb" },
  errorTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#111827" },
  errorBody: { fontSize: 14, color: "#4b5563", textAlign: "center", marginBottom: 16 },
  retryButton: { backgroundColor: "#15803d", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: "#ffffff", fontWeight: "600" },
});
