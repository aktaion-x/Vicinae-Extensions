// import { useEffect, useState } from "react";
// import { List, PopToRootType } from "@vicinae/api";

// import { getSystemStats, type SystemStats } from "./system";

// export default function Monitor() {
//   const [stats, setStats] = useState<SystemStats | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   console.log(PopToRootType);


//   useEffect(() => {
//     let active = true;
//     let timer: ReturnType<typeof setTimeout> | undefined;

//     async function refresh() {
//       try {
//         const nextStats = await getSystemStats();

//         if (!active) return;

//         setStats(nextStats);
//         setError(null);
//       } catch (err) {
//         if (!active) return;

//         setError(err instanceof Error ? err.message : String(err));
//       }

//       if (active) {
//         timer = setTimeout(refresh, 1000);
//       }
//     }

//     void refresh();

//     return () => {
//       active = false;

//       if (timer !== undefined) {
//         clearTimeout(timer);
//       }
//     };
//   }, []);


//   if (error && !stats) {
//     return <List>
//       <List.Item title="Unable to read system statistics" subtitle={error} />
//     </List>;
//   }

//   if (!stats) {
//     return <List isLoading />;
//   }

//   return (
//     <List>
//       <List.Item
//         title="CPU Usage"
//         subtitle={`${stats.cpuUsage.toFixed(1)}%`}
//       />
//       <List.Item
//         title="Memory Usage"
//         subtitle={`${stats.memoryUsage.toFixed(1)}%`}
//       />
//       <List.Item
//         title="Memory Used"
//         subtitle={`${formatBytes(stats.memoryUsed)} / ${formatBytes(stats.memoryTotal)}`}
//       />
//       <List.Item
//         title="CPU Temperature"
//         subtitle={
//           stats.cpuTemperature === null
//             ? "Unavailable"
//             : `${stats.cpuTemperature.toFixed(1)} °C`
//         }
//       />
//       <List.Item
//         title="Load Average (1 / 5 / 15 min)"
//         subtitle={`${stats.load1.toFixed(2)} / ${stats.load5.toFixed(2)} / ${stats.load15.toFixed(2)}`}
//       />
//       {/* <List.Item
//         title="Network"
//         subtitle="Current interface traffic"
//       /> */}
//       {stats.networks.map((net) => (
//         <List.Item
//           key={net.iface}
//           title={`Network: ${net.iface}`}
//           subtitle={`↓ ${formatRate(net.rxBytesPerSecond)}  ↑ ${formatRate(net.txBytesPerSecond)}`}
//         />
//       ))}
//       {/* <List.Item
//         title="Disk Filesystems"
//         subtitle="Mounted storage usage"
//       /> */}
//       {stats.disks.map((disk) => (
//         <List.Item
//           key={`${disk.mount}:${disk.filesystem}`}
//           title={disk.mount}
//           subtitle={`${disk.usage.toFixed(1)}% used · ${formatBytes(disk.available)} free / ${formatBytes(disk.size)}`}
//         />
//       ))}
//       {error && (
//         <List.Item
//           title="Refresh failed"
//           subtitle={error}
//         />
//       )}
//     </List>
//   );
// }

// function formatBytes(bytes: number): string {
//   const units = ["B", "KB", "MB", "GB", "TB"];
//   let value = bytes;
//   let unit = 0;

//   while (value >= 1024 && unit < units.length - 1) {
//     value /= 1024;
//     unit++;
//   }

//   return `${value.toFixed(1)} ${units[unit]}`;
// }


// function formatRate(bytesPerSecond: number): string {
//   const units = ["B/s", "KB/s", "MB/s", "GB/s"];

//   let value = bytesPerSecond;
//   let unit = 0;

//   while (value >= 1024 && unit < units.length - 1) {
//     value /= 1024;
//     unit++;
//   }

//   return `${value.toFixed(1)} ${units[unit]}`;
// }






// /*   useEffect(() => {
//     let active = true;

//     async function refresh() {
//       try {
//         const nextStats = await getSystemStats();

//         if (active) {
//           setStats(nextStats);
//           setError(null);
//         }
//       } catch (err) {
//         if (active) {
//           setError(
//             err instanceof Error ? err.message : String(err)
//           );
//         }
//       }
//     }

//     void refresh();

//     const timer = setInterval(() => {
//       void refresh();
//     }, 1000);

//     return () => {
//       active = false;
//       clearInterval(timer);
//     };
//   }, []);
//  */


import { useEffect, useState } from "react";
import { List } from "@vicinae/api";
import {
  getFastStats,
  getSlowStats,
  type FastStats,
  type SlowStats,
} from "./system";

export default function Monitor() {
  const [fast, setFast] = useState<FastStats | null>(null);
  const [slow, setSlow] = useState<SlowStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let fastTimer: ReturnType<typeof setTimeout> | undefined;
    let slowTimer: ReturnType<typeof setTimeout> | undefined;

    async function pollFast() {
      try {
        const result = await getFastStats();

        if (!active) return;

        setFast(result);
        setError(null);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }

      if (active) {
        fastTimer = setTimeout(() => void pollFast(), 1000);
      }
    }

    async function pollSlow() {
      try {
        const result = await getSlowStats();

        if (!active) return;

        setSlow(result);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }

      if (active) {
        slowTimer = setTimeout(() => void pollSlow(), 15000);
      }
    }

    void pollFast();
    void pollSlow();

    return () => {
      active = false;
      if (fastTimer !== undefined) clearTimeout(fastTimer);
      if (slowTimer !== undefined) clearTimeout(slowTimer);
    };
  }, []);

  if (!fast || !slow) {
    return (
      <List isLoading>
        <List.EmptyView
          title="Reading system statistics"
          description={error ?? "Collecting initial measurements..."}
        />
      </List>
    );
  }

  return (
    <List>
      <List.Section title="Processor">
        <List.Item
          title="CPU Usage"
          subtitle={`${fast.cpuUsage.toFixed(1)}%`}
        />
        <List.Item
          title="Load Average"
          subtitle={`${fast.load1.toFixed(2)} / ${fast.load5.toFixed(2)} / ${fast.load15.toFixed(2)}`}
        />
        <List.Item
          title="CPU Temperature"
          subtitle={
            slow.cpuTemperature === null
              ? "Unavailable"
              : `${slow.cpuTemperature.toFixed(1)} °C`
          }
        />
      </List.Section>

      <List.Section title="Memory">
        <List.Item
          title="RAM Usage"
          subtitle={`${slow.memoryUsage.toFixed(1)}% · ${formatBytes(slow.memoryUsed)} / ${formatBytes(slow.memoryTotal)}`}
        />
      </List.Section>

      <List.Section title="Network">
        {fast.networks.length === 0 ? (
          <List.Item title="No active interfaces found" />
        ) : fast.networks.map((net) => (
          <List.Item
            key={net.iface}
            title={net.iface}
            subtitle={`↓ ${formatRate(net.rxBytesPerSecond)} · ↑ ${formatRate(net.txBytesPerSecond)}`}
          />
        ))}
      </List.Section>

      <List.Section title="Disk Activity">
        <List.Item
          title="Read Speed"
          subtitle={formatRate(fast.diskReadBytesPerSecond)}
        />
        <List.Item
          title="Write Speed"
          subtitle={formatRate(fast.diskWriteBytesPerSecond)}
        />
      </List.Section>

      <List.Section title="Disk Capacity">
        {slow.disks.map((disk) => (
          <List.Item
            key={`${disk.mount}:${disk.filesystem}`}
            title={disk.mount}
            subtitle={`${disk.usage.toFixed(1)}% used · ${formatBytes(disk.available)} free / ${formatBytes(disk.size)}`}
          />
        ))}
      </List.Section>

      {error && (
        <List.Item title="Refresh error" subtitle={error} />
      )}
    </List>
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

function formatRate(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}