import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Network = {
    iface: string;
    default: boolean;
    ip4: string;
    ip4subnet: string;
    ip6: string;
    ip6subnet: string;
    mac: string;
    type: string;
    dhcp: boolean;
};

export default function NetworkInformation() {
    const [networkInfo, setNetworkInfo] = useState<Network[]>([]);

    useEffect(() => {
        async function getNetworkInfo() {
            try {
                const networks = await si.networkInterfaces();

                setNetworkInfo(
                    networks
                        .filter((network) => network.iface !== "lo")
                        .map((network) => ({
                            iface: network.iface,
                            default: network.default,
                            ip4: network.ip4,
                            ip4subnet: network.ip4subnet,
                            ip6: network.ip6,
                            ip6subnet: network.ip6subnet,
                            mac: network.mac,
                            type: network.type,
                            dhcp: network.dhcp,
                        }))
                );
            } catch (error) {
                console.error("Failed to fetch network information:", error);
            }
        }

        getNetworkInfo();
    }, []);

    return (
        <Detail
            markdown={
                networkInfo.length > 0
                    ? networkInfo
                          .map(
                              (network) => `
| Interface | ${network.iface} |
|:---------|------:|
| Default | ${network.default} |
| IPv4 | ${network.ip4} |
| IPv4 Subnet | ${network.ip4subnet} |
| IPv6 | ${network.ip6} |
| IPv6 Subnet | ${network.ip6subnet} |
| MAC Address | ${network.mac} |
| Type | ${network.type} |
| DHCP | ${network.dhcp} |
`
                          )
                          .join("\n")
                    : "No network interfaces found."
            }
        />
    );
}