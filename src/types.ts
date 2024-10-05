export interface BssidInfo {
    bssid: string | null;
    signal?: number; // Signal strength percentage
}

export interface BssidProps {
    bssidInfo: BssidInfo;
    isSelected: boolean;
    isSettingBssid: boolean;
    handleSetBssid: (bssid: string | null) => void;
}
