import os
import subprocess
import decky
from typing import TypedDict


class BSSID(TypedDict):
    bssid: str
    signal: int


def nmcli(*commands: str, fields: list[str] | None = None) -> str:
    command = ["nmcli"]
    if fields:
        command.extend(["-t", "-f", ",".join(fields)])
    command.extend(commands)
    decky.logger.info(f"> {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())

    text = result.stdout.strip().replace("\\", "")
    decky.logger.info(text)
    return text


def restart_connection(connection_name: str) -> None:
    nmcli("connection", "down", connection_name)
    # Retry the following up to 3 times:
    for i in range(3):
        try:
            nmcli("connection", "up", connection_name)
            return
        except RuntimeError as e:
            decky.logger.error(f"Error restarting connection: {str(e)}")
            if i == 2:
                raise e


def set_bssid_for_connection(connection_name: str, bssid: str | None) -> None:
    nmcli("connection", "modify", connection_name, "802-11-wireless.bssid", bssid or "")
    restart_connection(connection_name)


def get_current_ssid() -> str | None:
    for line in nmcli("device", "wifi", fields=["active", "ssid"]).split("\n"):
        if line.startswith("yes:"):
            return line.split(":", 1)[1]
    return None


def find_active_bssids(ssid: str) -> list[BSSID]:
    bssids = []
    for line in nmcli(
        "device", "wifi", "list", fields=["BSSID", "SIGNAL", "SSID"]
    ).split("\n"):
        if not line:
            continue
        parts = line.rsplit(":", maxsplit=2)
        if len(parts) != 3:
            continue
        bssid, signal, ssid_name = parts
        try:
            signal = int(signal)
        except ValueError:
            signal = 0

        if ssid_name == ssid:
            bssids.append(BSSID(bssid=bssid, signal=signal))
    return bssids


def get_connection_name() -> str | None:
    for line in nmcli(
        "connection", "show", "--active", fields=["NAME", "TYPE"]
    ).split("\n"):
        if not line:
            continue
        name, conn_type = line.split(":", maxsplit=1)
        if conn_type == "802-11-wireless":
            return name
    return None


def set_bssid(bssid: str | None) -> None:
    connection_name = get_connection_name()
    if not connection_name:
        raise RuntimeError("No active wireless connection found.")
    decky.logger.info(f"Active wireless connection: {connection_name}")

    # Set the BSSID
    set_bssid_for_connection(connection_name, bssid)
    decky.logger.info(f"Set BSSID to {bssid} for connection {connection_name}")

    restart_connection(connection_name)
    decky.logger.info(f"Connection {connection_name} restarted successfully.")


def get_current_bssid() -> str | None:
    connection_name = get_connection_name()
    if not connection_name:
        return None

    bssid = nmcli(
        "connection", "show", connection_name, fields=["802-11-wireless.bssid"]
    )
    parts = bssid.split(":", maxsplit=1)
    if len(parts) != 2:
        return None
    return parts[1].strip() or None


class Plugin:
    async def scan_bssids(self):
        try:
            ssid = get_current_ssid()
            if not ssid:
                return {'success': False, 'error': 'No active SSID found.'}

            decky.logger.info(f"Currently connected SSID: {ssid}")

            # List all available Wi-Fi networks with BSSID and SIGNAL
            bssids = find_active_bssids(ssid)

            if not bssids:
                return {
                    'success': False, 'error': 'No BSSIDs found for the current SSID.'
                }

            decky.logger.info(f"Found BSSIDs for SSID '{ssid}': {bssids}")

            return {'success': True, 'bssids': bssids}
        except Exception as e:
            decky.logger.error(f"Error in scan_bssids: {str(e)}")
            return {'success': False, 'error': str(e)}

    # Method to set a specific BSSID
    async def set_bssid(self, bssid: str | None):
        try:
            set_bssid(bssid)
            return {'success': True}
        except Exception as e:
            decky.logger.error(f"Error in set_bssid: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def get_current_bssid(self):
        try:
            bssid = get_current_bssid()
            return {'success': True, 'bssid': bssid}
        except Exception as e:
            decky.logger.error(f"Error in get_current_bssid: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def _main(self):
        decky.logger.info("BSSID Manager Plugin Loaded")

    # Function called first during the unload process
    async def _unload(self):
        decky.logger.info("Goodnight World!")
        pass

    # Function called after `_unload` during uninstall
    async def _uninstall(self):
        decky.logger.info("Goodbye World!")
        pass

    # Migrations that should be performed before entering `_main()`.
    async def _migration(self):
        decky.logger.info("Migrating")
        decky.migrate_logs(
            os.path.join(
                decky.DECKY_USER_HOME, ".config", "decky-template", "template.log"
            )
        )
        decky.migrate_settings(
            os.path.join(decky.DECKY_HOME, "settings", "template.json"),
            os.path.join(decky.DECKY_USER_HOME, ".config", "decky-template")
        )
        decky.migrate_runtime(
            os.path.join(decky.DECKY_HOME, "template"),
            os.path.join(decky.DECKY_USER_HOME, ".local", "share", "decky-template")
        )
