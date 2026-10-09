
import si from "systeminformation";
import os from "node:os";

export type FastStats = {
    cpuUsage: number;
    load1: number;
    load5: number;
    load15: number;
    networks: {
        iface: string;
        rxBytesPerSecond: number;
        txBytesPerSecond: number;
    }[];
    diskReadBytesPerSecond: number;
    diskWriteBytesPerSecond: number;
};

export type SlowStats = {
    memoryUsed: number;
    memoryTotal: number;
    memoryUsage: number;
    cpuTemperature: number | null;
    disks: {
        mount: string;
        filesystem: string;
        size: number;
        used: number;
        available: number;
        usage: number;
    }[];
};

export async function getFastStats(): Promise<FastStats> {
    // console.log('Fast Status');
    const [load, networks, diskIO] = await Promise.all([
        si.currentLoad(),
        si.networkStats(),
        si.fsStats(),
    ]);

    // console.log();
    
    const [load1, load5, load15] = os.loadavg();

    return {
        cpuUsage: load.currentLoad,
        load1,
        load5,
        load15,

        networks: networks
            .filter((net) => net.operstate === "up")
            .map((net) => ({
                iface: net.iface,
                rxBytesPerSecond: Math.max(
                    0,
                    Number(net.rx_sec) || 0,
                ),
                txBytesPerSecond: Math.max(
                    0,
                    Number(net.tx_sec) || 0,
                ),
            })),

        diskReadBytesPerSecond: Math.max(
            0,
            Number(diskIO.rx_sec) || 0,
        ),
        diskWriteBytesPerSecond: Math.max(
            0,
            Number(diskIO.wx_sec) || 0,
        ),
    };
}

export async function getSlowStats(): Promise<SlowStats> {
    // console.log('Slow Status');

    const [memory, temperature, filesystems] = await Promise.all([
        si.mem(),
        si.cpuTemperature(),
        si.fsSize(),
    ]);

    return {
        memoryUsed: memory.used,
        memoryTotal: memory.total,
        memoryUsage: memory.total > 0
            ? (memory.used / memory.total) * 100
            : 0,

        cpuTemperature:
            typeof temperature.main === "number" &&
                temperature.main > 0
                ? temperature.main
                : null,

        disks: filesystems
            .filter((disk) => disk.size > 0)
            .map((disk) => ({
                mount: disk.mount,
                filesystem: disk.fs,
                size: disk.size,
                used: disk.used,
                available: disk.available,
                usage: disk.use,
            })),
    };
}