import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Cpu = {
manufacturer: string;
brand: string;
family: string;
model: string;
speed: number;
cores: number;
processors: number;
virtualization: boolean;
};

export default function CpuInformation() {
    const [cpuInfo, setCpuInfo] = useState<Cpu | null>(null);
 
    useEffect(() => {
        async function getCpuInfo() {
            try {
                const cpu = await si.cpu();

                setCpuInfo({
                    manufacturer: cpu.manufacturer,
                    brand: cpu.brand,
                    family: cpu.family,
                    model: cpu.model,
                    speed: cpu.speed,
                    cores: cpu.cores,
                    processors: cpu.processors,
                    virtualization: cpu.virtualization,
                });

            } catch (error) {
                console.error("Failed to fetch system information:", error);
            }
        }

        getCpuInfo();
    }, []);

    return (
        <Detail
            markdown={cpuInfo ? `
| Manufacturer: | ${cpuInfo.manufacturer} |
|:---------|------:|
| Brand: | ${cpuInfo.brand} |
| Family: | ${cpuInfo.family} |
| Model: | ${cpuInfo.model} |
| Speed: | ${cpuInfo.speed} |
| Cores: | ${cpuInfo.cores} |
| Processors: | ${cpuInfo.processors} |
| Virtualization: | ${cpuInfo.virtualization} |
`  : ''}
        />
    )
}