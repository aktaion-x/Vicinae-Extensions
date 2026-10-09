import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Filesystem = {
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    use: number;
    mount: string;
    rw: boolean | null;
};

export default function FilesystemInformation() {
    const [filesystemInfo, setFilesystemInfo] = useState<Filesystem[]>([]);

    useEffect(() => {
        async function getFilesystemInfo() {
            try {
                const filesystems = await si.fsSize();

                setFilesystemInfo(
                    filesystems.map((filesystem) => ({
                        fs: filesystem.fs,
                        type: filesystem.type,
                        size: filesystem.size,
                        used: filesystem.used,
                        available: filesystem.available,
                        use: filesystem.use,
                        mount: filesystem.mount,
                        rw: filesystem.rw,
                    }))
                );
            } catch (error) {
                console.error("Failed to fetch filesystem information:", error);
            }
        }

        getFilesystemInfo();
    }, []);

    return (
        <Detail
            markdown={
                filesystemInfo.length > 0
                    ? filesystemInfo
                          .map(
                              (filesystem, i) => `
| Mount | ${filesystem.mount} |
|:---------|------:|
| Filesystem | ${filesystem.fs} |
| Type | ${filesystem.type} |
| Size | ${formatBytes(filesystem.size)} |
| Used | ${formatBytes(filesystem.used)} |
| Available | ${formatBytes(filesystem.available)} |
| Usage | ${filesystem.use}% |
| Mount Point | ${filesystem.mount} |
| Read/Write | ${filesystem.rw} | 
${filesystemInfo.length -1 != i ? `---` : ``}
`
                          )
                          .join("\n")
                    : "No filesystems found."
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