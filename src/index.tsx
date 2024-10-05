import {PanelSection, PanelSectionRow, staticClasses} from "@decky/ui";
import {FunctionComponent, useCallback, useEffect, useState} from "react";
import {FaWifi} from "react-icons/fa";
import {callable, definePlugin} from "@decky/api";
import {BssidInfo} from "./types";
import {BssidRow} from "./BssidRow";

// Define the callable APIs with proper type annotations
const scanBssids = callable<[], { success: boolean; bssids?: BssidInfo[]; error?: string }>("scan_bssids");
const setBssid = callable<[bssid: string | null], { success: boolean; error?: string }>("set_bssid");
const getCurrentBssid = callable<[], { success: boolean; bssid?: string | null; error?: string }>("get_current_bssid");

const Content: FunctionComponent = () => {
  const [bssids, setBssids] = useState<BssidInfo[]>([]);
  const [currentBssid, setCurrentBssid] = useState<string | null>(null);
  const [isSettingBssid, setIsSettingBssid] = useState<boolean>(false);

  // Fetch available BSSIDs
  const fetchBssids = useCallback(async () => {
    try {
      const result = await scanBssids();
      if (result.success && result.bssids) {
        // Sort BSSIDs by signal strength, handling undefined signals
        const sortedBssids = [...result.bssids].sort(
          (a, b) => (b.signal ?? 0) - (a.signal ?? 0)
        );

        // Check if currentBssid is not in the scanned list
        if (currentBssid && !sortedBssids.some(bssid => bssid.bssid === currentBssid)) {
          // Add the current BSSID with undefined signal strength
          sortedBssids.unshift({ bssid: currentBssid, signal: undefined });
        }

        setBssids(sortedBssids);
        console.info(`Available BSSIDs: ${JSON.stringify(sortedBssids)}`);
      } else {
        console.error(result.error || "Failed to scan BSSIDs.");
      }
    } catch (error) {
      console.error("Unexpected error scanning BSSIDs:", error);
    } finally {
    }
  }, [currentBssid]);


  // Get the current BSSID
  const handleGetCurrentBssid = useCallback(async () => {
    try {
      const result = await getCurrentBssid();
      if (result.success) {
        // Explicitly handle null or undefined BSSID
        setCurrentBssid(result.bssid ?? null);
      } else {
        console.error(result.error || "Failed to get current BSSID.");
      }
    } catch (error) {
      console.error("Unexpected error getting current BSSID:", error);
    }
  }, []);

  // Set BSSID
  const handleSetBssid = useCallback(async (bssid: string | null) => {
    if (isSettingBssid) return; // Prevent multiple clicks
    setIsSettingBssid(true);
    try {
      const result = await setBssid(bssid);
      if (result.success) {
        setCurrentBssid(bssid);
        // Immediately fetch the current BSSID to confirm
        await handleGetCurrentBssid();
      } else {
        console.error(`Error setting BSSID: ${result.error}`);
      }
    } catch (error) {
      console.error("Unexpected error setting BSSID:", error);
    } finally {
      setIsSettingBssid(false);
    }
  }, [isSettingBssid, handleGetCurrentBssid]);

  useEffect(() => {
    const updateBssidsAndBssid = async () => {
      await fetchBssids();
      await handleGetCurrentBssid();
    };

    // Fetch BSSIDs immediately when the component mounts
    updateBssidsAndBssid();

    // Set up a timer to refresh the BSSIDs and current BSSID every 5 seconds
    const timer = setInterval(updateBssidsAndBssid, 5000);

    return () => clearInterval(timer);
  }, [fetchBssids, handleGetCurrentBssid]);


  // Prepare the full list of BSSIDs including the "None" option
  const fullBssidList: BssidInfo[] = [
    ...bssids,
    {bssid: null, signal: undefined}, // Represents "None"
  ];

  return (
      <PanelSection title="Force an access point">
          {/* Display the list of BSSIDs with selection capability */}
          <div style={{width: "100%"}}>
            {fullBssidList.map((bssidInfo) => {
            const isSelected =
              (bssidInfo.bssid === null && currentBssid === null) ||
              (bssidInfo.bssid !== null && bssidInfo.bssid === currentBssid);

            return (
              <PanelSectionRow key={bssidInfo.bssid ?? "none"}>
                <BssidRow
                  bssidInfo={bssidInfo}
                  isSelected={isSelected}
                  isSettingBssid={isSettingBssid}
                  handleSetBssid={handleSetBssid}
                />
              </PanelSectionRow>
            );
          })}
        </div>
    </PanelSection>
  );
};

// Define and export the plugin
export default definePlugin(() => ({
  name: "Network Manager",
  titleView: <div className={staticClasses.Title} style={{ fontSize: '0.9em', padding: '5px', margin: '5px' }}>
    Network Manager
  </div>,
  content: <Content />,
  icon: <FaWifi />,
}));
