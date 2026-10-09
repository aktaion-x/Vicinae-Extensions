export type FilterType = "all" | "directories" | "files";

type Entry = {
    name: string;
    path: string;
    isDirectory: boolean;
};

export function filterEntries(
    entries: Entry[],
    filter: FilterType,
): Entry[] {
    return entries.filter((entry) => {
        switch (filter) {
            case "directories":
                return entry.isDirectory;

            case "files":
                return !entry.isDirectory;

            case "all":
            default:
                return true;
        }
    });
}
