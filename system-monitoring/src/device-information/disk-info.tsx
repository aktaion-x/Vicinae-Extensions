import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type DiskLayout = {
    device: string;
    type: string;
    name: string;
    vendor: string;
    size: number;
    interfaceType: string;
    serialNum: string;
};

export default function DiskInformation() {
    const [diskInfo, setDiskInfo] = useState<DiskLayout[] | []>([]);

    useEffect(() => {
        async function getDiskInfo() {
            try {
                const disks = await si.diskLayout();
                // const disk = disks;

                if (!disks.length) return;

                setDiskInfo(disks.map(disk => {
                    return {
                    device: disk.device,
                    type: disk.type,
                    name: disk.name,
                    vendor: disk.vendor,
                    size: disk.size,
                    interfaceType: disk.interfaceType,
                    serialNum: disk.serialNum,
                }
                }));
            } catch (error) {
                console.error("Failed to fetch disk information:", error);
            }
        }

        getDiskInfo();
    }, []);

    return (
        <Detail
            markdown={
                diskInfo.length != 0
                    ? `${diskInfo.map(disk => (
                        `
| Device | ${disk.device} |
|:---------|------:|
| Type | ${disk.type} |
| Name | ${disk.name} |
| Vendor | ${disk.vendor} |
| Size | ${formatBytes(disk.size)} |
| Interface Type | ${disk.interfaceType} |
| Serial Number | ${disk.serialNum} |
`
                    ))}`
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