import React from "react";
import {FaBan, FaCheck, FaSignal} from "react-icons/fa";
import {BssidProps} from "./types";


const getSignalColor = (signal: number): string => {
    if (signal >= 80) return "#28a745"; // Green for Excellent
    if (signal >= 60) return "#ffc107"; // Yellow for Good
    if (signal >= 40) return "#fd7e14"; // Orange for Fair
    if (signal >= 20) return "#dc3545"; // Red for Weak
    return "#6c757d"; // Grey for Very Weak
};

export const BssidRow: React.FC<BssidProps> = ({
  bssidInfo,
  isSelected,
  isSettingBssid,
  handleSetBssid,
}) => (
  <div
    role="button"
    aria-selected={isSelected}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      padding: "8px 12px",
      boxSizing: "border-box", // Without this the right side gets cut off
      backgroundColor: isSelected ? "#f1f3f5" : "transparent",
      borderRadius: "4px",
      cursor: isSettingBssid ? "not-allowed" : "pointer",
      opacity: isSettingBssid ? 0.6 : 1, // Reduce opacity if setting BSSID
      transition: "background-color 0.3s, opacity 0.3s",
    }}
    onClick={() => {
      if (!isSettingBssid) handleSetBssid(bssidInfo.bssid);
    }}
  >
    <span
      style={{
        display: "flex",
        alignItems: "center",
        flex: 1,
        flexGrow: 1,
        overflow: "hidden",
      }}
    >
      {isSelected && (
        <FaCheck style={{ marginRight: "8px", color: "#28a745", flexShrink: 0 }} />
      )}
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {bssidInfo.bssid || "Automatic"}
      </span>
    </span>
    <span
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        color: bssidInfo.signal !== undefined ? getSignalColor(bssidInfo.signal) : "#6c757d",
        whiteSpace: "nowrap",
        flexGrow: 0,
        marginLeft: "auto",
      }}
    >
      {bssidInfo.signal !== undefined && (
        <FaSignal style={{ marginRight: "4px" }} />
      )}
      {bssidInfo.signal === undefined && bssidInfo.bssid !== null && (
        <FaBan style={{ marginRight: "4px", color: "#6c757d" }} />
      )}
      {bssidInfo.signal !== undefined ? `${bssidInfo.signal}%` : ""}
    </span>
  </div>
);
