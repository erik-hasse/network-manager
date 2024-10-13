import {PanelSection, PanelSectionRow, staticClasses} from "@decky/ui";
import {FunctionComponent, useCallback, useEffect, useState} from "react";
import {FaWifi} from "react-icons/fa";
import {callable, definePlugin} from "@decky/api";
import {BssidInfo} from "./types";
import {BssidRow} from "./BssidRow";

const scanBssids = callable<[], { success: boolean; bssids?: BssidInfo[]; error?: string }>("scan_bssids");
const setBssid = callable<[bssid: string | null], { success: boolean; error?: string }>("set_bssid");
const getCurrentBssid = callable<[], { success: boolean; bssid?: string | null; error?: string }>("get_current_bssid");

const Content: FunctionComponent = () => {
  const [bssids, setBssids] = useState<BssidInfo[]>([]);
  const [currentBssid, setCurrentBssid] = useState<string | null>(null);
  const [isSettingBssid, setIsSettingBssid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch available BSSIDs
  const fetchBssids = useCallback(async () => {
    try {
      const result = await scanBssids();
      if (result.success && result.bssids) {
        const sortedBssids = [...result.bssids].sort(
          (a, b) => (b.signal ?? 0) - (a.signal ?? 0)
        );

        if (currentBssid && !sortedBssids.some(bssid => bssid.bssid === currentBssid)) {
          sortedBssids.unshift({ bssid: currentBssid });
        }

        setBssids(sortedBssids);
        console.info(`Available BSSIDs: ${JSON.stringify(sortedBssids)}`);
      } else {
        console.error(result.error || "Failed to scan BSSIDs.");
      }
    } catch (error) {
      console.error("Unexpected error scanning BSSIDs:", error);
    }
  }, [currentBssid]);

  // Get the current BSSID
  const handleGetCurrentBssid = useCallback(async () => {
    try {
      const result = await getCurrentBssid();
      if (result.success) {
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
    if (isSettingBssid) return;  // Prevent multiple clicks
    if (bssid === currentBssid) return; // Skip if already selected
    setIsSettingBssid(true);
    try {
      const result = await setBssid(bssid);
      if (result.success) {
        setCurrentBssid(bssid);
        // Fetch the current BSSID again to ensure it's updated
        await handleGetCurrentBssid();
      } else {
        console.error(`Error setting BSSID: ${result.error}`);
      }
    } catch (error) {
      console.error("Unexpected error setting BSSID:", error);
    } finally {
      setIsSettingBssid(false);
    }
  }, [isSettingBssid, currentBssid, handleGetCurrentBssid]);

  useEffect(() => {
    const updateBssidsAndBssid = async () => {
      await handleGetCurrentBssid();
      await fetchBssids();
      setLoading(false);
    };

    updateBssidsAndBssid();
    const timer = setInterval(updateBssidsAndBssid, 5000);
    return () => clearInterval(timer);
  }, [fetchBssids, handleGetCurrentBssid]);

  const fullBssidList: BssidInfo[] = [
    ...bssids,
    { bssid: null, signal: undefined }, // Represents "Automatic"
  ];

  return (
      <PanelSection title="Select an access point">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ width: "100%" }}>
            {fullBssidList.map((bssidInfo, index) => {
              const isSelected = bssidInfo.bssid === currentBssid;

              return (
                <PanelSectionRow key={bssidInfo.bssid ?? "none"}>
                  <BssidRow
                    bssidInfo={bssidInfo}
                    isSelected={isSelected}
                    isSettingBssid={isSettingBssid}
                    handleSetBssid={handleSetBssid}
                    position={
                      index === 0
                        ? "top"
                        : index === fullBssidList.length - 1
                        ? "bottom"
                        : "middle"
                    }
                  />
                </PanelSectionRow>
              );
            })}
          </div>
        )}
      </PanelSection>
  );
};

export default definePlugin(() => ({
  name: "Network Manager",
  titleView: <div className={staticClasses.Title} style={{ fontSize: '0.9em', padding: '5px', margin: '5px' }}>
    Network Manager
  </div>,
  content: <Content />,
  icon: <FaWifi />,
}));
