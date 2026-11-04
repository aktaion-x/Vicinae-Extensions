import { spawn } from "node:child_process";

export async function suggestCorrections(word: string, deepSearch: boolean): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const child = spawn("aspell", [
      "-a",
      `--sug-mode=${deepSearch ? "bad-spellers" : "slow"}`,
      "--lang=en",
      "--encoding=utf-8",
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (data: string) => {
      stdout += data;
    });

    child.stderr.on("data", (data: string) => {
      stderr += data;
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Aspell exited with code ${code}`));
        return;
      }

      const line = stdout
        .split(/\r?\n/)
        .find((line) => line.startsWith("&") || line.startsWith("#"));

      if (!line || line.startsWith("#")) {
        resolve([word]);
        return;
      }

      const match = line.match(/^&\s+.+?\s+\d+\s+\d+:\s*(.*)$/);

      resolve([word, ...(match ? match[1].split(/,\s*/) : [])]);
    });

    child.stdin.end(word + "\n");
  });
}
