import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Memory = {
    total: number;
    free: number;
    used: number;
    active: number;
    swaptotal: number;
    swapused: number;
    swapfree: number;
    cached: number;
    buffers: number;
};

export default function MemoryInformation() {
    const [memoryInfo, setMemoryInfo] = useState<Memory | null>(null);

    useEffect(() => {
        async function getMemoryInfo() {
            try {
                const mem = await si.mem();

                setMemoryInfo({
                    total: mem.total,
                    free: mem.free,
                    used: mem.used,
                    active: mem.active,
                    swaptotal: mem.swaptotal,
                    swapused: mem.swapused,
                    swapfree: mem.swapfree,
                    cached: mem.cached,
                    buffers: mem.buffers,
                });
            } catch (error) {
                console.error("Failed to fetch memory information:", error);
            }
        }

        getMemoryInfo();
    }, []);

    return (
        <Detail
            markdown={
                memoryInfo
                    ? `
| Property | Value |
|:---------|------:|
| Total | ${formatBytes(memoryInfo.total)} |
| Free | ${formatBytes(memoryInfo.free)} |
| Used | ${formatBytes(memoryInfo.used)} |
| Active | ${formatBytes(memoryInfo.active)} |
| Swap Total | ${formatBytes(memoryInfo.swaptotal)} |
| Swap Used | ${formatBytes(memoryInfo.swapused)} |
| Swap Free | ${formatBytes(memoryInfo.swapfree)} |
| Cached | ${formatBytes(memoryInfo.cached)} |
| Buffers | ${formatBytes(memoryInfo.buffers)} |
`
                    : ""
            }
        />
    );
}


function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }

  return `${value.toFixed(1)} ${units[unit]}`;
}