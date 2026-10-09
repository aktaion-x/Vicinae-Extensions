import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type OS = {
    osInfo_platform: string;
    osInfo_distro: string;
    osInfo_release: string;
    osInfo_codename: string;
    osInfo_kernel: string;
    osInfo_arch: string;
    osInfo_hostname: string;
    osInfo_serial: string;
};

type User = {
    username: string;
    users_tty: string;
};

export default function OSInformation() {
    const [OSInfo, setOSInfo] = useState<OS | null>(null);
    const [usersInfo, setUsersInfo] = useState<User[]>([]);

    useEffect(() => {
        async function getOSInfo() {
            try {
                const [osInfo, users] =
                    await Promise.all([
                        si.osInfo(),
                        si.users(),
                    ]);

                setOSInfo({
                    osInfo_platform: osInfo.platform,
                    osInfo_distro: osInfo.distro,
                    osInfo_release: osInfo.release,
                    osInfo_codename: osInfo.codename,
                    osInfo_kernel: osInfo.kernel,
                    osInfo_arch: osInfo.arch,
                    osInfo_hostname: osInfo.hostname,
                    osInfo_serial: osInfo.serial,
                });

                setUsersInfo(
                    users.map((u) => ({
                        username: u.user,
                        users_tty: u.tty,
                    }))
                );
            } catch (error) {
                console.error("Failed to fetch system information:", error);
            }
        }

        getOSInfo();
    }, []);

    return (
        <Detail
            markdown={OSInfo ? `
| Platform: | ${OSInfo.osInfo_platform} |
|:---------|------:|
| Distro: | ${OSInfo.osInfo_distro} |
| Release: | ${OSInfo.osInfo_release} |
| Codename: | ${OSInfo.osInfo_codename} |
| Kernel: | ${OSInfo.osInfo_kernel} |
| Arch: | ${OSInfo.osInfo_arch} |
| Serial: | ${OSInfo.osInfo_serial} |${usersInfo.map((u, i) => `
| Username - ${i + 1} : | ${u.username} |
| tty - ${i + 1} : | ${u.users_tty} |
    `)}
`  : ''}
        />
    )
}