import {
  Action,
  ActionPanel,
  Icon,
  List,
  useNavigation,
} from '@vicinae/api';

import { glob, readdir, readFile, readlink, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { useEffect, useState } from 'react';
import fs from 'fs';



type Entry = {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
};

type FileInfo = {
  path: string;
  content: string;
  items?: number;
  fileSize: string;
  createdTime: string;
  modifiedTime: string;
}

const home = homedir();


async function readTextFile(filePath: string) {
  try {
    const stats = await stat(filePath);

    const fileInfo: FileInfo = {
      path: filePath,
      content: '',
      createdTime: stats.birthtime.toISOString(),
      modifiedTime: stats.mtime.toISOString(),
      fileSize: `${(stats.size / 1024).toFixed(2)} KB`
    }

    if (!stats.isFile()) {
      const items = await readdir(filePath);
      fileInfo.fileSize = '';
      fileInfo.items = items.length;
      return fileInfo;
    };

    const stream = fs.createReadStream(filePath);
    const decoder = new TextDecoder('utf-8', { fatal: true });

    let content = '';

    for await (const chunk of stream) {
      // Reject binary files
      if (chunk.includes(0)) {
        stream.destroy();
        return fileInfo;
      }

      content += decoder.decode(chunk, { stream: true });
    }

    // Validate remaining UTF-8 bytes
    content += decoder.decode();

    // return content;
    fileInfo.content = content;
    return fileInfo;

  } catch (error) {
    console.error(error);
    return;
  }
}

function expandHome(value: string) {
  if (value === '~') return home;
  if (value.startsWith('~/')) {
    return path.join(home, value.slice(2));
  }
  return value;
}

async function getFiles(
  directory: string,
  pattern = ['*', '.*']
): Promise<Entry[]> {
  const files = [];

  for await (const entry of glob(pattern, {
    cwd: directory,
    withFileTypes: true,
  })) {
    files.push({
      name: entry.name,
      path: directory,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
      isSymbolicLink: entry.isSymbolicLink(),
    });
  }

  return sortEntries(files);
}

function sortEntries(entries: Entry[]) {
  return entries.sort(
    (a, b) => Number(b.isDirectory) - Number(a.isDirectory)
  );
}

function matchesCurrentList(name: string, query: string) {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

async function resolveCaseInsensitive(
  base: string,
  target: string
): Promise<string> {
  const absolute = path.isAbsolute(target)
    ? target
    : path.resolve(base, target);

  const root = path.parse(absolute).root;
  const segments = absolute.slice(root.length).split(path.sep).filter(Boolean);

  let current = root;

  for (const segment of segments) {
    const entries = await readdir(current);

    const match = entries.find(
      entry => entry.toLowerCase() === segment.toLowerCase()
    );

    if (!match) {
      throw new Error(`Directory not found: ${segment}`);
    }

    current = path.join(current, match);
  }

  return current;
}

export default function Test({
  dirPath = home,
}: {
  dirPath?: string;
}) {
  const [currentPath, setCurrentPath] = useState(dirPath);
  const [currentEntry, setCurrentEntry] = useState('')
  const [searchText, setSearchText] = useState('');
  const [baseEntries, setBaseEntries] = useState<Entry[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState<FileInfo>();
  const { push } = useNavigation();

  useEffect(() => {
    const load = async () => {
      if (currentEntry) {
        // const x = (await stat(currentEntry)).isDirectory();
        // const y = (await stat(currentEntry)).;
        const content = await readTextFile(currentEntry);
        if (content) {
          setFileInfo(content);
        } else {
          setFileInfo(undefined)
        }
        // const x = await readFile(currentEntry);
        // const y = await readlink(currentEntry);
        // console.log({ x });
        // console.log({ y });
      }
    }
    load()
  }, [currentEntry])

  // Load the current directory independently.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      try {
        const files = await getFiles(currentPath);

        if (!cancelled) {
          setBaseEntries(files);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setBaseEntries([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [currentPath]);

  // Resolve the search query.
  useEffect(() => {
    let cancelled = false;

    async function search() {
      const query = searchText.trim();

      // Empty query: show the current directory.
      if (!query) {
        setEntries(baseEntries);
        return;
      }

      // 1. Directory-relative glob:


      // 2. Absolute or home-relative path:
      // /home/aktai
      // ~/Downlo
      if (
        query.startsWith('/') ||
        query.startsWith('~/') ||
        query === '~'
      ) {
        setIsLoading(true);

        try {
          const expanded = expandHome(query);
          const hasTrailingSlash = query.endsWith('/');

          const parent = path.dirname(expanded);
          const prefix = path.basename(expanded);

          // Resolve parent case-insensitively.
          const resolvedParent = await resolveCaseInsensitive(
            path.parse(expanded).root,
            parent
          );

          // Try to find the final segment case-insensitively.
          const parentEntries = await readdir(resolvedParent);

          const match = parentEntries.find(
            entry => entry.toLowerCase() === prefix.toLowerCase()
          );

          if (match) {
            const resolved = path.join(resolvedParent, match);

            const info = await stat(resolved);

            if (info.isDirectory()) {
              const files = await getFiles(resolved);

              if (!cancelled) setEntries(files);
              return;
            }
          }

          // Otherwise, autocomplete the parent directory.
          const files = await getFiles(resolvedParent);

          const filtered = files.filter(entry =>
            entry.name.toLowerCase().startsWith(prefix.toLowerCase())
          );

          if (!cancelled) setEntries(filtered);

        } catch (error) {
          if (!cancelled) {
            console.error(error);
            setEntries([]);
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }

        return;
      }
      // Downloads/*.png
      if (query.includes('/')) {
        setIsLoading(true);

        try {
          const lastSlash = query.lastIndexOf('/');
          const directoryPart = query.slice(0, lastSlash);
          const filter = query.slice(lastSlash + 1);

          const directory = await resolveCaseInsensitive(
            currentPath,
            expandHome(directoryPart)
          );

          const files = await getFiles(directory);

          const filtered = filter
            ? files.filter(entry =>
              entry.name.toLowerCase().includes(filter.toLowerCase())
            )
            : files;

          if (!cancelled) setEntries(filtered);
        } catch (error) {
          if (!cancelled) {
            console.error(error);
            setEntries([]);
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }

        return;
      }

      // 3. Ordinary text/glob filtering:
      // imag, *.txt, *docu*
      const filtered = baseEntries.filter((entry) =>
        matchesCurrentList(entry.name, query)
      );

      setEntries(filtered);
    }

    search();

    return () => {
      cancelled = true;
    };
  }, [searchText, baseEntries, currentPath]);

  return (
    <List
      filtering={false}
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchText={searchText}
      isShowingDetail={true}
      navigationTitle={`${entries.length} entry`}
      onSelectionChange={(id) => setCurrentEntry(id)}
    >
      {entries.map((entry) => {
        const fullPath = path.join(entry.path, entry.name);

        return (
          <List.Item
            key={fullPath}
            id={fullPath}
            title={entry.name}
            icon={
              entry.isDirectory
                ? Icon.Folder
                : Icon.NewDocument
            }
            detail={
              <>
                <List.Item.Detail markdown={fileInfo?.content || 'Data is unreadable'} metadata={
                  <List.Item.Detail.Metadata>
                    {fileInfo?.path && <List.Item.Detail.Metadata.Label title="File path" text={fileInfo?.path} />}
                    {fileInfo?.fileSize && <List.Item.Detail.Metadata.Label title="File size" text={fileInfo?.fileSize} />}
                    {fileInfo?.items?.toString() && <List.Item.Detail.Metadata.Label title="Items " text={fileInfo?.items?.toString()} />}
                    {fileInfo?.createdTime && <List.Item.Detail.Metadata.Label title="Created at" text={fileInfo?.createdTime} />}
                    {fileInfo?.modifiedTime && <List.Item.Detail.Metadata.Label title="Modified at" text={fileInfo?.modifiedTime} />}
                  </List.Item.Detail.Metadata>
                } />
              </>
            }
            actions={
              <ActionPanel>
                {entry.isDirectory && (
                  <Action
                    icon={Icon.AppWindow}
                    title="Open Directory"
                    shortcut={{
                      modifiers: ['alt'],
                      key: 'arrowRight',
                    }}
                    onAction={() => {
                      push(<Test dirPath={fullPath} />);
                    }}
                  />
                )}
                {entry.isDirectory && (
                  <Action
                    title="Autocomplete"
                    shortcut={{
                      modifiers: ['ctrl'],
                      key: 'tab',
                    }}
                    onAction={() => {
                      setSearchText(fullPath);
                    }}
                  />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
