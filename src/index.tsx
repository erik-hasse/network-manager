import {
  ButtonItem,
  Menu,
  MenuItem,
  PanelSection,
  PanelSectionRow,
  showContextMenu,
  staticClasses,
} from "@decky/ui";
import { FunctionComponent, useState, useEffect, useCallback } from "react";
import { FaWifi, FaSignal } from "react-icons/fa";
import { callable, definePlugin, toaster } from "@decky/api";

// Define the callable APIs with proper type annotations
const scanBssids = callable<[], { success: boolean; bssids?: BssidInfo[]; error?: string }>("scan_bssids");
const setBssid = callable<[bssid: string | null], { success: boolean; error?: string }>("set_bssid");
const getCurrentBssid = callable<[], { success: boolean; bssid?: string; error?: string }>("get_current_bssid");

// Define the BssidInfo interface
interface BssidInfo {
  bssid: string | null;
  signal?: number; // Signal strength percentage
}

const Content: FunctionComponent = () => {
  const [bssids, setBssids] = useState<BssidInfo[]>([]);
  const [currentBssid, setCurrentBssid] = useState<string | null>(null);

  // Fetch available BSSIDs
  const fetchBssids = useCallback(async () => {
    try {
      const result = await scanBssids();
      if (result.success && result.bssids) {
        // Sort BSSIDs by signal strength, handling undefined signals
        const sortedBssids = [...result.bssids].sort(
          (a, b) => (b.signal ?? 0) - (a.signal ?? 0)
        );
        setBssids(sortedBssids);
        console.info(`Available BSSIDs: ${JSON.stringify(sortedBssids)}`);
      } else {
        console.error(result.error || "Failed to scan BSSIDs.");
        toaster.toast({
          title: "Error",
          body: result.error || "Failed to scan BSSIDs.",
          expiration: 0,
        });
      }
    } catch (error) {
      console.error("Unexpected error scanning BSSIDs:", error);
      toaster.toast({
        title: "Error",
        body: "Unexpected error scanning BSSIDs.",
        expiration: 0,
      });
    }
  }, []);

  // Set BSSID
  const handleSetBssid = useCallback(async (bssid: string | null) => {
    try {
      const result = await setBssid(bssid);
      if (result.success) {
        setCurrentBssid(bssid);
        toaster.toast({
          title: "BSSID Set",
          body: "Successfully set BSSID.",
          expiration: 0,
        });
      } else {
        toaster.toast({
          title: "Error",
          body: result.error || "Failed to set BSSID.",
          expiration: 0,
        });
        console.error(`Error setting BSSID: ${result.error}`);
      }
    } catch (error) {
      console.error("Unexpected error setting BSSID:", error);
      toaster.toast({
        title: "Error",
        body: "Unexpected error setting BSSID.",
        expiration: 0,
      });
    }
  }, []);

  // Get the current BSSID
  const handleGetCurrentBssid = useCallback(async () => {
    try {
      const result = await getCurrentBssid();
      if (result.success && result.bssid) {
        setCurrentBssid(result.bssid);
      } else {
        console.error(result.error || "Failed to get current BSSID.");
      }
    } catch (error) {
      console.error("Unexpected error getting current BSSID:", error);
    }
  }, []);

  // useEffect to fetch BSSIDs and set up a polling interval
  useEffect(() => {
    fetchBssids();
    handleGetCurrentBssid();

    // Set up a timer to refresh the current BSSID every 5 seconds
    const timer = setInterval(handleGetCurrentBssid, 5000);
    return () => clearInterval(timer);
  }, [fetchBssids, handleGetCurrentBssid]);

  // Helper function to determine signal color based on strength
  const getSignalColor = (signal: number): string => {
    if (signal >= 80) return "#28a745"; // Green for Excellent
    if (signal >= 60) return "#ffc107"; // Yellow for Good
    if (signal >= 40) return "#fd7e14"; // Orange for Fair
    if (signal >= 20) return "#dc3545"; // Red for Weak
    return "#6c757d"; // Grey for Very Weak
  };

  // Helper function to build the BSSID display component
  const buildBssidDiv = (bssidInfo: BssidInfo) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <span>{bssidInfo.bssid || "None"}</span>
      {typeof bssidInfo.signal === "number" && (
        <span style={{ display: "flex", alignItems: "center", color: getSignalColor(bssidInfo.signal) }}>
          <FaSignal style={{ marginRight: "4px" }} /> {bssidInfo.signal}%
        </span>
      )}
    </div>
  );

  // Find the currently selected BSSID information
  const foundBssid = bssids.find((bssidInfo) => bssidInfo.bssid === currentBssid) || { bssid: currentBssid };

  return (
    <PanelSection title="BSSID">
      {/* Button to open the BSSID selection context menu */}
      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={(e) =>
            showContextMenu(
              <Menu label="Available BSSIDs" cancelText="Cancel">
                {bssids.map((bssidInfo) => (
                  <MenuItem
                    key={bssidInfo.bssid ?? "none"}
                    onSelected={() => handleSetBssid(bssidInfo.bssid)}
                  >
                    {buildBssidDiv(bssidInfo)}
                  </MenuItem>
                ))}
                <MenuItem key="None" onSelected={() => handleSetBssid(null)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>None</span>
                  </div>
                </MenuItem>
              </Menu>,
              e.currentTarget ?? window
            )
          }
        >
          Change BSSID
        </ButtonItem>
      </PanelSectionRow>

      {/* Display the currently selected BSSID */}
      <PanelSectionRow>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontSize: "smaller", textAlign: "left" }}>Current BSSID</div>
          {buildBssidDiv(foundBssid)}
        </div>
      </PanelSectionRow>
    </PanelSection>
  );
};

// Define and export the plugin
export default definePlugin(() => ({
  name: "Network Manager",
  titleView: <div className={staticClasses.Title}>Network Manager</div>,
  content: <Content />,
  icon: <FaWifi />,
}));
