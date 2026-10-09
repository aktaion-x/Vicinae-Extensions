import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Audio = {
    id: string | number;
    name: string;
    manufacturer: string;
    channel: string;
    status: string;
};

export default function AudioInformation() {
    const [audioInfo, setAudioInfo] = useState<Audio[]>([]);

    useEffect(() => {
        async function getAudioInfo() {
            try {
                const audio = await si.audio();

                setAudioInfo(
                    audio.map((device) => ({
                        id: device.id,
                        name: device.name,
                        manufacturer: device.manufacturer,
                        channel: device.channel,
                        status: device.status,
                    }))
                );
            } catch (error) {
                console.error("Failed to fetch audio information:", error);
            }
        }

        getAudioInfo();
    }, []);

    return (
        <Detail
            markdown={
                audioInfo.length > 0
                    ? audioInfo
                          .map(
                              (device) => `
| Model | ${device.name} |
|:---------|------:|
| Manufacturer | ${device.manufacturer} |
| Channel | ${device.channel} |
| Status | ${device.status} |
| ID | ${device.id} |
`
                          )
                          .join("\n")
                    : "No audio devices found."
            }
        />
    );
}