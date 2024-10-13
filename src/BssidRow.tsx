import React from "react";
import {FaBan, FaCheck, FaSignal} from "react-icons/fa";
import {BssidInfo, BssidProps} from "./types";
import {DialogButton} from "@decky/ui";

const getSignalColor = (signal: number): string => {
    if (signal >= 80) return "#28a745"; // Green for Excellent
    if (signal >= 60) return "#ffc107"; // Yellow for Good
    if (signal >= 40) return "#fd7e14"; // Orange for Fair
    if (signal >= 20) return "#dc3545"; // Red for Weak
    return "#6c757d"; // Grey for Very Weak
};

const SignalIcon: React.FC<BssidInfo> = ({signal, bssid}) => (
    <div
        style={{
            display: "flex",
            flex: 1,
            flexGrow: 0,
            alignItems: "center",
            color: signal !== undefined ? getSignalColor(signal) : "#6c757d",
        }}
    >
        {signal !== undefined && (
            <FaSignal
                style={{
                    marginRight: "4px",
                    verticalAlign: "middle", // Ensures icon aligns with text
                }}
            />
        )}
        {signal === undefined && bssid !== null && (
            <FaBan style={{
                marginRight: "4px",
                color: "#6c757d",
                verticalAlign: "middle"
            }}/>
        )}
        {signal !== undefined ? `${signal}%` : ""}
    </div>
);

export const BssidRow: React.FC<BssidProps> = ({
                                                   bssidInfo,
                                                   isSelected,
                                                   isSettingBssid,
                                                   handleSetBssid,
                                                   position,
                                               }) => (
    <DialogButton
        onClick={() => {
            if (!isSettingBssid) handleSetBssid(bssidInfo.bssid)
        }}
        disabled={isSettingBssid}
        style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: "8px",
            paddingLeft: "8px",
            width: "100%",
            borderRadius: position === "middle" ? 0 : position === "bottom" ? "0 0 2px 2px" : "2px 2px 0 0",
        }}
    >
        <FaCheck
            style={{
                marginRight: "8px",
                color: "#28a745",
                opacity: isSelected ? 1 : 0,
                verticalAlign: "middle", // Ensures icon aligns with text
            }}
        />
        <div
            style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                whiteSpace: "nowrap", // Prevent text from wrapping
                overflow: "hidden", // Hide overflowed text
                textOverflow: "ellipsis", // Show ellipsis when text overflows
                margin: 0,
            }}
        >
            {bssidInfo.bssid || "Automatic"}
        </div>
        <SignalIcon {...bssidInfo} />
    </DialogButton>
);
