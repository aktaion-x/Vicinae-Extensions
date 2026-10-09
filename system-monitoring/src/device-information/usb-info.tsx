import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Usb = {
    bus: number;
    deviceId: number;
    id: string | number;
    name: string;
    type: string;
    vendor: string;
    man: string;
    maxPower: string;
};

export default function UsbInformation() {
    const [usbInfo, setUsbInfo] = useState<Usb[]>([]);

    useEffect(() => {
        async function getUsbInfo() {
            try {
                const usb = await si.usb();

                setUsbInfo(
                    usb.map((device) => ({
                        bus: device.bus,
                        deviceId: device.deviceId,
                        id: device.id,
                        name: device.name,
                        type: device.type,
                        vendor: device.vendor,
                        man: device.manufacturer,
                        maxPower: device.maxPower,
                    }))
                );
            } catch (error) {
                console.error("Failed to fetch USB information:", error);
            }
        }

        getUsbInfo();
    }, []);

    return (
        <Detail
            markdown={
                usbInfo.length > 0
                    ? usbInfo
                          .map(
                              (device, i) => `
| *Name* | *${device.name}* |
|:---------|------:|
| Bus | ${device.bus} |
| Device ID | ${device.deviceId} |
| ID | ${device.id} |
| Type | ${device.type} |
| Vendor | ${device.vendor} |
| Manufacturer | ${device.man} |
| Max Power | ${device.maxPower} |
${usbInfo.length -1 != i ? `` : ``}
`
                          )
                          .join("\n")
                    : "No USB devices found."
            }
        />
    );
}