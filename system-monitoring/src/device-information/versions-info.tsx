import si from "systeminformation";
import { Detail } from "@vicinae/api";
import { useEffect, useState } from "react";

type Versions = {
    kernel: string | undefined;
    bash: string | undefined;
    gcc: string | undefined;
    git: string | undefined;
    node: string | undefined;
    npm: string | undefined;
    openssl: string | undefined;
    pip3: string | undefined;
    pip: string | undefined;
    python: string | undefined;
    python3: string | undefined;
    v8: string | undefined;
    zsh: string | undefined;
};

export default function VersionsInformation() {
    const [versionsInfo, setVersionsInfo] = useState<Versions | null>(null);

    useEffect(() => {
        async function getVersionsInfo() {
            try {
const versions = await si.versions() as Awaited<
    ReturnType<typeof si.versions>
> & {
    bash?: string;
    zsh?: string;
};
                setVersionsInfo({
                    kernel: versions.kernel,
                    bash: versions.bash,
                    gcc: versions.gcc,
                    git: versions.git,
                    node: versions.node,
                    npm: versions.npm,
                    openssl: versions.openssl,
                    pip3: versions.pip3,
                    pip: versions.pip,
                    python: versions.python,
                    python3: versions.python3,
                    v8: versions.v8,
                    zsh: versions.zsh,
                });
            } catch (error) {
                console.error("Failed to fetch version information:", error);
            }
        }

        getVersionsInfo();
    }, []);

    return (
        <Detail
            markdown={
                versionsInfo
                    ? `
| Property | Version |
|:---------|--------:|
| Kernel | ${versionsInfo.kernel} |
| Bash | ${versionsInfo.bash} |
| GCC | ${versionsInfo.gcc} |
| Git | ${versionsInfo.git} |
| Node.js | ${versionsInfo.node} |
| npm | ${versionsInfo.npm} |
| OpenSSL | ${versionsInfo.openssl} |
| pip | ${versionsInfo.pip} |
| pip3 | ${versionsInfo.pip3} |
| Python | ${versionsInfo.python} |
| Python3 | ${versionsInfo.python3} |
| V8 | ${versionsInfo.v8} |
| Zsh | ${versionsInfo.zsh} |
`
                    : ""
            }
        />
    );
}