import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Pc = {
    system_version: string;
    system_manufacturer: string;
    system_model: string;
    system_virtual: boolean;
    uuid_os: string;
    osInfo_platform: string;
    osInfo_distro: string;
    osInfo_uefi: boolean | null;
    bios_vendor: string;
    bios_version: string;
};

export default function PcInformation() {
    const [pcInfo, setPcInfo] = useState<Pc | null>(null);

    useEffect(() => {
        console.log('from pc information');
        
        async function getPcInfo() {
            try {
                const [system, osInfo, uuid, bios] =
                    await Promise.all([
                        si.system(),
                        si.osInfo(),
                        si.uuid(),
                        si.bios(),
                    ]);

                setPcInfo({
                    system_manufacturer: system.manufacturer,
                    system_model: system.model,
                    system_version: system.version,
                    system_virtual: system.virtual,
                    uuid_os: uuid.os,
                    osInfo_platform: osInfo.platform,
                    osInfo_distro: osInfo.distro,
                    osInfo_uefi: osInfo.uefi,
                    bios_vendor: bios.vendor,
                    bios_version: bios.version,
                });

            } catch (error) {
                console.error("Failed to fetch system information:", error);
            }
        }

        getPcInfo();
    }, []);

    return (
        <Detail
            markdown={pcInfo ? `
|  System Version:  | ${pcInfo.system_version} |
|:---------|------:|
|  System Manufacturer:  | ${pcInfo.system_manufacturer} |
|  System Model:  | ${pcInfo.system_model} |
|  UUID:  | ${pcInfo.uuid_os} |
|  Platform:  | ${pcInfo.osInfo_platform} |
|  Distro:  | ${pcInfo.osInfo_distro} |
|  BIOS Version:  | ${pcInfo.bios_version} |
|  BIOS Vendor:  | ${pcInfo.bios_vendor} |
| is UEFI:  | ${pcInfo.osInfo_uefi}|
`  : ''}
        />
    )
}