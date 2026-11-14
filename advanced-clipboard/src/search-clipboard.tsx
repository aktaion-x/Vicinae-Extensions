import {
	Action,
	ActionPanel,
	Detail,
	Icon,
	List,
	showToast,
	Toast,
} from "@vicinae/api";
import { useEffect, useState } from "react";
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'path';

interface FileContent {
	filename: string;
	filepath: string;
	content: string;
	createdAt: Date;
	modifiedAt: Date;
}

export default function SimpleList() {
	const [data, setData] = useState<FileContent[]>([]);
	useEffect(() => {
		const load = async () => {
			const files = await readDirectory("/home/aktaion/.local/share/vicinae/clipboard-data");
			setData(files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
			console.log(files);
		}
		load()
	}, [])

	return (
		<List searchBarPlaceholder="Search..." isShowingDetail={true}>
			<List.Section title={`${data.length} Items`}>
				{data.map(entry => (
					<List.Item key={entry.filename} icon={Icon.Text} title={entry.content.slice(0, 50).trim()} detail={

						<List.Item.Detail
							markdown={`${entry.content}`}
						/>
					} />
				))}
			</List.Section>
		</List>
	);
}

async function readDirectory(directory: string): Promise<FileContent[]> {
	const entries = await readdir(directory, { withFileTypes: true });

	const results: FileContent[] = [];

	for (const entry of entries) {
		if (!entry.isFile()) continue;

		const fullPath = path.join(directory, entry.name);

		const [content, fileStats] = await Promise.all([
			readFile(fullPath, "utf8"),
			stat(fullPath)
		]);

		results.push({
			filename: entry.name,
			filepath: fullPath,
			content,
			createdAt: fileStats.birthtime,
			modifiedAt: fileStats.mtime
		});
	}

	return results;
}