import {
  Activity,
  Cpu,
  Globe,
  Thermometer
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";

const { width } = Dimensions.get("window");

const API_ENDPOINTS = [
  "http://192.168.1.69:9000/api/Sensors",
  "http://100.94.132.33:9000/api/Sensors"
];

export default function HomeScreen() {
  const [apiBase, setApiBase] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [ram, setRam] = useState<any>(null);
  const [status, setStatus] = useState<"Online" | "Offline">("Offline");
  const [loading, setLoading] = useState(false);

  const detectApi = async (): Promise<string> => {
    for (const base of API_ENDPOINTS) {
      try {
        const res = await fetch(`${base}/CheckStatus`);
        const text = await res.text();

        if (res.ok && text.includes("Online")) {
          return base;
        }
      } catch {}
    }
    throw new Error("Offline");
  };

  const loadData = async () => {
    try {
      const base = apiBase ?? (await detectApi());

      const statusRes = await fetch(`${base}/CheckStatus`);
      const statusText = await statusRes.text();

      if (!statusText.includes("Online")) {
        throw new Error("Offline");
      }

      setStatus("Online");
      setApiBase(base);

      const tempRes = await fetch(`${base}/GetTemperature`);
      if (tempRes.ok) {
        const tempJson = await tempRes.json();
        setTemperature(tempJson.temperature);
      }

      const ramRes = await fetch(`${base}/RamUsage`);
      if (ramRes.ok) {
        const ramJson = await ramRes.json();
        setRam(ramJson);
      }
    } catch (err) {
      setStatus("Offline");
      setApiBase(null);
      setTemperature(null);
      setRam(null);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 2000);

    return () => clearInterval(interval);
  }, [apiBase]);

  const getTempColor = (t: number) => {
    if (t < 45) return "#10b981";
    if (t < 65) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Monitoramento</Text>
          <Text style={styles.title}>Fedora Server</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: status === "Online" ? "#064e3b" : "#450a0a" }
          ]}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: status === "Online" ? "#10b981" : "#ef4444" }
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: status === "Online" ? "#10b981" : "#ef4444" }
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              setLoading(true);
              await loadData();
              setLoading(false);
            }}
            tintColor="#3b82f6"
          />
        }
      >
        <View style={styles.grid}>
          <View style={styles.miniCard}>
            <Thermometer
              size={20}
              color={
                temperature !== null
                  ? getTempColor(temperature)
                  : "#94a3b8"
              }
            />
            <Text style={styles.miniLabel}>Temp. CPU</Text>
            <Text
              style={[
                styles.miniValue,
                {
                  color:
                    temperature !== null
                      ? getTempColor(temperature)
                      : "#f8fafc"
                }
              ]}
            >
              {temperature !== null
                ? `${temperature.toFixed(1)}°C`
                : "—"}
            </Text>
          </View>

          <View style={styles.miniCard}>
            <Activity size={20} color="#3b82f6" />
            <Text style={styles.miniLabel}>Uptime</Text>
            <Text style={styles.miniValue}>—</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Cpu size={22} color="#8b5cf6" />
            <Text style={styles.cardTitle}>Memória RAM</Text>
          </View>

          {ram ? (
            <View style={styles.ramContainer}>
              <View style={styles.ramTextRow}>
                <Text style={styles.ramUsageText}>
                  {ram.usedMB}
                  <Text style={{ fontSize: 12, color: "#64748b" }}> MB</Text>
                </Text>
                <Text style={styles.ramTotalText}>
                  de {ram.totalMB} MB
                </Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${ram.usedPercent}%`,
                      backgroundColor:
                        ram.usedPercent > 80 ? "#ef4444" : "#8b5cf6"
                    }
                  ]}
                />
              </View>

              <Text style={styles.percentText}>
                {ram.usedPercent}% em uso
              </Text>
            </View>
          ) : (
            <ActivityIndicator
              color="#8b5cf6"
              style={{ marginTop: 10 }}
            />
          )}
        </View>

        {apiBase && (
          <View style={[styles.card, styles.connectionCard]}>
            <Globe size={18} color="#94a3b8" />
            <Text style={styles.connectionText}>
              {apiBase.replace("http://", "")}
            </Text>
          </View>
        )}

        <Text style={styles.footerText}>
          Atualizando automaticamente
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617"
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  greeting: {
    color: "#94a3b8",
    fontSize: 14
  },
  title: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "800"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12
  },
  miniCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
    borderRadius: 20
  },
  miniLabel: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 8
  },
  miniValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700"
  },
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 20,
    borderRadius: 24,
    marginBottom: 12
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600"
  },
  ramContainer: {
    width: "100%"
  },
  ramTextRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 8
  },
  ramUsageText: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700"
  },
  ramTotalText: {
    color: "#64748b",
    fontSize: 14
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "#1e293b",
    borderRadius: 5,
    overflow: "hidden"
  },
  progressBarFill: {
    height: "100%"
  },
  percentText: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 8,
    textAlign: "right"
  },
  connectionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    backgroundColor: "transparent",
    borderStyle: "dashed"
  },
  connectionText: {
    color: "#64748b",
    fontSize: 12
  },
  footerText: {
    textAlign: "center",
    color: "#475569",
    fontSize: 12,
    marginTop: 20
  }
});