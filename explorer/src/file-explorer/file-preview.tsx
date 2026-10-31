import { useEffect, useState } from "react";
import { List } from "@vicinae/api";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";


type PreviewKind =
  | "image"
  | "text"
  | "pdf"
  | "audio"
  | "video"
  | "unknown";


export default function FilePreview({ currentPath }: { currentPath: string }) {
  const [preview, setPreview] = useState<{
    path: string;
    mime: string;
    kind: PreviewKind;
    content: string;
  } | null>(null);

  useEffect(() => {

    if (!currentPath) {
      setPreview(null);
      return;
    }

    async function loadPreview() {
      try {
        const mime = await getMimeType(currentPath);
        const kind = getPreviewKind(mime);

        if (kind === "text") {
          const content = await readFile(currentPath, "utf8");

          setPreview({
            path: currentPath,
            mime,
            kind,
            content,
          });

          return;
        }

        setPreview({
          path: currentPath,
          mime,
          kind,
          content: ''
        });
      } catch {
        setPreview({
          path: currentPath,
          mime: "unknown",
          kind: "unknown",
          content: ''
        });
      }
    }

    loadPreview();

  }, [currentPath])

  if (preview) {
    switch (preview.kind) {
      case "image":
        return (
          <List.Item.Detail markdown={`![](${pathToFileURL(preview.path).href})`} metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Name" text={preview.path.split('/')[preview.path.split('/').length - 1]} />
              <List.Item.Detail.Metadata.Label title="Path" text={preview.path} />
              <List.Item.Detail.Metadata.Label title="Type" text={preview.mime} />
            </List.Item.Detail.Metadata>
          } />);

      case "text":
        return (
          <List.Item.Detail markdown={`\`\`\`\n${preview.content ?? ""}\n\`\`\``} metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Name" text={preview.path.split('/')[preview.path.split('/').length - 1]} />
              <List.Item.Detail.Metadata.Label title="Path" text={preview.path} />
              <List.Item.Detail.Metadata.Label title="Type" text={preview.mime} />
            </List.Item.Detail.Metadata>
          } />);

      default:
        const iconPath = getIconPath(preview.path)
        return (
          <List.Item.Detail markdown={`![](${pathToFileURL(iconPath).href})`}
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="Name" text={preview.path.split('/')[preview.path.split('/').length - 1]} />
                <List.Item.Detail.Metadata.Label title="Path" text={preview.path} />
                <List.Item.Detail.Metadata.Label title="Type" text={preview.mime} />
              </List.Item.Detail.Metadata>
            } />);
    }
  }

}

const execFileAsync = promisify(execFile);

async function getMimeType(filePath: string) {
  const { stdout } = await execFileAsync("file", [
    "--mime-type",
    "--brief",
    filePath,
  ]);

  return stdout.trim();
}

function getPreviewKind(mime: string): PreviewKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/")) return "text";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";

  return "unknown";
}

// function getIconPath(path: string) {
// 	try {
// 		const output = execFileSync(
// 			"/home/aktaion/.local/share/vicinae/scripts/get-icon-path",
// 			[path],
// 			{ encoding: "utf8" },
// 		);

// 		return output;
// 	} catch (error) {
// 		console.error('error: ', error)
// 	}
// }

function getIconPath(path: string) {
  const icon = execFileSync("gjs", ["/home/aktaion/.local/share/vicinae/scripts/get-icon-path", path], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  return icon;
}