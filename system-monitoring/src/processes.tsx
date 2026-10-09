
// import { useEffect, useState } from "react";
// import { Action, ActionPanel, List } from "@vicinae/api";
// import si from "systeminformation";

// type ProcessInfo = {
//   pid: number;
//   parentPid: number;
//   name: string;
//   cpu: number;
//   mem: number;
//   memRss: number;
//   state: string;
//   user: string;
//   command: string;
// };

// type ProcessSnapshot = {
//   all: number;
//   running: number;
//   list: ProcessInfo[];
// };

// type SortMode = "cpu" | "memory";

// export default function Processes() {
//   const [snapshot, setSnapshot] = useState<ProcessSnapshot | null>(null);
//   const [sortMode, setSortMode] = useState<SortMode>("cpu");
//   const [error, setError] = useState<string | null>(null);
//   const [isShowingDetail, setIsShowingDetail] = useState(false);

//   useEffect(() => {
//     let active = true;
//     let timer: ReturnType<typeof setTimeout> | undefined;

//     async function refresh() {
//       try {
//         const result = await si.processes();

//         if (!active) return;

//         setSnapshot({
//           all: result.all,
//           running: result.running,
//           list: result.list.map((p) => ({
//             pid: p.pid,
//             parentPid: p.parentPid,
//             name: p.name,
//             cpu: p.cpu,
//             mem: p.mem,
//             memRss: p.memRss,
//             state: p.state,
//             user: p.user,
//             command: p.command,
//           })),
//         });

//         setError(null);
//       } catch (err) {
//         if (active) {
//           setError(err instanceof Error ? err.message : String(err));
//         }
//       }

//       if (active) {
//         timer = setTimeout(() => void refresh(), 3000);
//       }
//     }

//     void refresh();

//     return () => {
//       active = false;
//       if (timer !== undefined) clearTimeout(timer);
//     };
//   }, []);

//   const processes = snapshot?.list ?? [];

//   const topCpu = [...processes]
//     .sort((a, b) => b.cpu - a.cpu)
//     .slice(0, 30);

//   const topMemory = [...processes]
//     .sort((a, b) => b.memRss - a.memRss)
//     .slice(0, 30);

//   const visibleProcesses =
//     sortMode === "cpu" ? topCpu : topMemory;

//   if (!snapshot) {
//     return (
//       <List isLoading>
//         <List.EmptyView
//           title="Loading processes"
//           description={error ?? "Reading process statistics..."}
//         />
//       </List>
//     );
//   }

//   return (
//     <List
//       isShowingDetail={isShowingDetail}
//       searchBarPlaceholder="Search processes by name or PID..."
//       onSelectionChange={(id) => {
//         // Selection details are shown by the selected item's detail.
//       }}
//       actions={
//         <ActionPanel>
//             <Action title="Toggle detail" shortcut={{modifiers: ['ctrl'], key: 'e'}} onAction={() => setIsShowingDetail(!isShowingDetail)} />
//         </ActionPanel>
//       }
//     >
//       <List.EmptyView
//         title="No matching processes"
//         description="Try a different search term."
//       />

//       <List.Section
//         title={`Processes (${snapshot.all})`}
//         subtitle={`${snapshot.running} running`}
//       >
//         {visibleProcesses.map((p) => (
//           <List.Item
//             key={p.pid}
//             id={String(p.pid)}
//             title={p.name || p.command || "Unknown process"}
//             subtitle={`PID ${p.pid} · ${p.state} · ${p.user || "unknown user"}`}
//             accessories={!isShowingDetail ? [
//               {
//                 text: `CPU ${p.cpu.toFixed(1)}%`,
//               },
//               {
//                 text: `RAM ${formatBytes(p.memRss * 1024)}`,
//               },
//             ]: undefined}
//             detail={
//               <List.Item.Detail
//                 markdown={[
//                   `# ${p.name}`,
//                   "",
//                   `- **PID:** ${p.pid}`,
//                   `- **Parent PID:** ${p.parentPid}`,
//                   `- **CPU:** ${p.cpu.toFixed(1)}%`,
//                   `- **Memory:** ${formatBytes(p.memRss * 1024)}`,
//                   `- **System memory:** ${p.mem.toFixed(2)}%`,
//                   `- **State:** ${p.state}`,
//                   `- **User:** ${p.user || "Unknown"}`,
//                   "",
//                   "## Command",
//                   "",
//                   `\`${p.command || p.name}\``,
//                 ].join("\n")}
//               />
//             }
//           />
//         ))}
//       </List.Section>
//     </List>
//   );
// }

// function formatBytes(bytes: number): string {
//   const units = ["B", "KB", "MB", "GB", "TB"];
//   let value = Math.max(0, bytes || 0);
//   let unit = 0;

//   while (value >= 1024 && unit < units.length - 1) {
//     value /= 1024;
//     unit++;
//   }

//   return `${value.toFixed(1)} ${units[unit]}`;
// }


import { useEffect, useState } from "react";
import { Action, ActionPanel, List, showToast, Toast } from "@vicinae/api";
import si from "systeminformation";
import { readlink } from "node:fs/promises";

type SortMode = "cpu" | "memory";

type ProcessSignal = "SIGTERM" | "SIGKILL" | "SIGSTOP" | "SIGCONT";

type ProcessInfo = {
    pid: number;
    parentPid: number;
    name: string;
    cpu: number;
    mem: number;
    memRss: number;
    state: string;
    user: string;
    command: string;
    path: string;
};

type ProcessSnapshot = {
    all: number;
    running: number;
    list: ProcessInfo[];
};

export default function Processes() {
    const [snapshot, setSnapshot] = useState<ProcessSnapshot | null>(null);
    const [sortMode, setSortMode] = useState<SortMode>("cpu");
    const [error, setError] = useState<string | null>(null);
    const [isShowingDetail, setIsShowingDetail] = useState(false);

    useEffect(() => {
        let active = true;
        let timer: ReturnType<typeof setTimeout> | undefined;

        async function refresh() {
            try {
                const result = await si.processes();                

                console.log(result.all);
                
                
                if (!active) return;
                
                setSnapshot({
                    all: result.all,
                    running: result.running,
                    list: result.list.map((p) => ({
                        pid: p.pid,
                        parentPid: p.parentPid,
                        name: p.name,
                        cpu: p.cpu,
                        mem: p.mem,
                        memRss: p.memRss,
                        state: p.state,
                        user: p.user,
                        command: p.command,
                        path: p.path
                    })),
                });

                setError(null);
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error ? err.message : String(err),
                    );
                }
            }

            if (active) {
                timer = setTimeout(() => void refresh(), 3000);
            }
        }

        void refresh();

        return () => {
            active = false;
            if (timer !== undefined) clearTimeout(timer);
        };
    }, []);

    const processes = snapshot?.list ?? [];

    const sortedProcesses = [...processes].sort((a, b) =>
        sortMode === "cpu"
            ? b.cpu - a.cpu
            : b.memRss - a.memRss,
    ).slice(0, 60);

    return (
        <List
            isShowingDetail={isShowingDetail}
            isLoading={!snapshot}
            searchBarPlaceholder="Search processes by name or PID..."
            searchBarAccessory={
                <List.Dropdown
                    tooltip="Sort processes"
                    value={sortMode}
                    onChange={(value) =>
                        setSortMode(value as SortMode)
                    }
                >
                    <List.Dropdown.Item
                        title="Highest CPU"
                        value="cpu"
                    />
                    <List.Dropdown.Item
                        title="Highest RAM"
                        value="memory"
                    />
                </List.Dropdown>
            }
        >
            {!snapshot ? (
                <List.EmptyView
                    title={error ? "Could not load processes" : "Loading processes"}
                    description={error ?? "Reading process statistics..."}
                />
            ) : (
                <List.Section
                    title={`Processes (${snapshot.all})`}
                    subtitle={`${snapshot.running} running · Sorted by ${sortMode === "cpu" ? "CPU" : "RAM"
                        }`}
                >
                    {sortedProcesses.map((p) => (

                        <List.Item
                            key={p.pid}
                            title={p.name || p.command || "Unknown process"}
                            subtitle={`PID ${p.pid} · ${p.state} · ${p.user || "unknown user"}`}
                            accessories={!isShowingDetail ? [
                                { text: `CPU ${p.cpu.toFixed(1)}%` },
                                { text: `RAM ${formatBytes(p.memRss * 1024)}` },
                            ] : undefined}
                            detail={
                                <List.Item.Detail
                                    markdown={[
                                        `## ${p.name}`,
                                        "",
                                        `- **PID:** ${p.pid}`,
                                        `- **Parent PID:** ${p.parentPid}`,
                                        `- **CPU:** ${p.cpu.toFixed(1)}%`,
                                        `- **Memory:** ${formatBytes(p.memRss * 1024)}`,
                                        `- **System memory:** ${p.mem.toFixed(2)}%`,
                                        `- **State:** ${p.state}`,
                                        `- **Path:** ${p.path || "Access not allowed"}`,
                                        `- **User:** ${p.user || "Unknown"}`,
                                        "",
                                        "##### Command",
                                        "",
                                        `\`${p.command || p.name}\``,
                                    ].join("\n")}
                                />
                            }
                            actions={
                                <ActionPanel>
                                    {p.path ? <Action.CopyToClipboard shortcut={{ modifiers: ['ctrl'], key: 'c' }} title="Copy path to clipboard" content={`${p.path}/${p.command}`} /> : undefined}
                                    <Action title="Toggle detail" shortcut={{ modifiers: ['ctrl'], key: 'e' }} onAction={() => setIsShowingDetail(!isShowingDetail)} />
                                    <Action title="Resume Process" shortcut={{ modifiers: ['ctrl'], key: 'r' }} onAction={() => void sendSignal(p.pid, "SIGCONT", "Resume")} />
                                    <Action title="Suspend Process" shortcut={{ modifiers: ['ctrl'], key: 's' }} onAction={() => void sendSignal(p.pid, "SIGSTOP", "Suspend")} />
                                    <Action title="Terminate Process" shortcut={{ modifiers: ['ctrl'], key: 'delete' }} onAction={() => void sendSignal(p.pid, "SIGTERM", "Terminate")} />
                                    <Action title="Force Kill Process" shortcut={{ modifiers: ['ctrl', 'shift'], key: 'delete' }} onAction={() => void sendSignal(p.pid, "SIGKILL", "Force kill")} />
                                    {/* <Action
                                        title="Copy Executable Path"
                                        onAction={async () => {
                                            const executablePath = await getExecutablePath(p.pid);
                                            if (!executablePath) {
                                                await showToast({
                                                    style: Toast.Style.Failure,
                                                    title: "Could not read executable path",
                                                    message: `PID ${p.pid} may have exited or access was denied.`,
                                                });
                                                return;
                                            }
                                            console.log({executablePath});
                                            await Action.CopyToClipboard({content: executablePath});
                                        }} /> */}
                                </ActionPanel>
                            }
                        />
                    ))}
                </List.Section>
            )}
        </List>
    );
}

async function sendSignal(
    pid: number,
    signal: ProcessSignal,
    actionName: string,
) {
    // Avoid targeting critical or extension-owning processes.
    if (pid <= 1 || pid === process.pid) {
        await showToast({
            style: Toast.Style.Failure,
            title: "Protected process",
            message: `Refusing to signal PID ${pid}`,
        });
        return;
    }

    try {
        process.kill(pid, signal);

        await showToast({
            style: Toast.Style.Success,
            title: `${actionName} signal sent`,
            message: `PID ${pid}`,
        });
    } catch (error) {
        await showToast({
            style: Toast.Style.Failure,
            title: `${actionName} failed`,
            message:
                error instanceof Error ? error.message : String(error),
        });
    }
}


async function getExecutablePath(pid: number): Promise<string | null> {
    try {
        return await readlink(`/proc/${pid}/exe`);
    } catch {
        return null;
    }
}

function formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = Math.max(0, bytes || 0);
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }

    return `${value.toFixed(1)} ${units[unit]}`;
}