import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Time = {
    current: number;
    uptime: number;
    timezone: string;
    timezoneName: string;
};

export default function TimeInformation() {
    const [timeInfo, setTimeInfo] = useState<Time | null>(null);

    useEffect(() => {
        async function getTimeInfo() {
            try {
                const time = await si.time();

                setTimeInfo({
                    current: time.current,
                    uptime: time.uptime,
                    timezone: time.timezone,
                    timezoneName: time.timezoneName,
                });
            } catch (error) {
                console.error("Failed to fetch time information:", error);
            }
        }

        getTimeInfo();
    }, []);

    return (
        <Detail
            markdown={
                timeInfo
                    ? `
| Current Time | ${new Date(timeInfo.current).toISOString()} |
|:---------|------:|
| Uptime | ${formatDuration(timeInfo.uptime)} |
| Timezone | ${timeInfo.timezone} |
| Timezone Name | ${timeInfo.timezoneName} |
`
                    : ""
            }
        />
    );
}
function formatDuration(duration:number) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = (duration % 60).toFixed(2);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
