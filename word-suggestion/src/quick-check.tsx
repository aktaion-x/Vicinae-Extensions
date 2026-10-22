// import { useEffect, useState } from "react";
// import { spawn } from "node:child_process";
// import { Action, getSelectedText, ActionPanel, List } from "@vicinae/api";

// export default function ViewTranslate() {
//   const [wordList, setWordList] = useState<string[]>([]);
//   const [deepSearch, setDeepSearch] = useState(false);
//   const [word, setWord] = useState("");
//   const [isLoading, setIsLoading] = useState(false)
//   useEffect(() => {
//     // if (!word.trim()) {
//     //   setWordList([]);
//     //   return;
//     // }
//     async function load() {
//       const selectedText = await getSelectedText();
//       // console.log(selectedText);

//       if (!selectedText) return;
//       setWord(selectedText)
//       // try {
//       //   const suggestions = await suggestCorrections(selectedText, deepSearch);
//       //   setWordList(suggestions);
//       // } catch (error) {
//       //   console.error("Spellcheck failed:", error);
//       //   setWordList([]);
//       // } finally {
//       //   setIsLoading(false)
//       // }
//       // const response = await simpleTranslate(selectedText)
//       // console.log(response);
//       // setTranslation(`**${response}**`)
//     }
//     load()
//   }, [])

//   useEffect(() => {
//     if (!word.trim()) {
//       setWordList([]);
//       return;
//     }

//     const timeout = setTimeout(async () => {
//       try {
//         const suggestions = await suggestCorrections(word, deepSearch);
//         setWordList(suggestions);
//       } catch (error) {
//         console.error("Spellcheck failed:", error);
//         setWordList([]);
//       } finally {
//         setIsLoading(false)
//       }
//     }, 500);

//     // Cancel the timer if the user types again.
//     return () => clearTimeout(timeout);
//   }, [word, deepSearch]);

//   return (
//     <List
//       searchBarPlaceholder='Spell word...'
//       searchText={word}
//       onSearchTextChange={(text) => {
//         setWord(text);
//         setIsLoading(text ? true : false);
//       }}
//       isLoading={isLoading}>
//       {wordList.map((suggestion) => (
//         <List.Item title={suggestion} key={suggestion} actions={
//           <ActionPanel>
//             <Action.CopyToClipboard content={suggestion} />
//             <Action title="Toggle bad spellings" onAction={() => setDeepSearch(!deepSearch)} />
//           </ActionPanel>
//         } />
//       ))}
//     </List>
//   );
// }




// async function suggestCorrections(word: string, deepSearch: boolean): Promise<string[]> {
//   return new Promise((resolve, reject) => {
//     const child = spawn("aspell", [
//       "-a",
//       `--sug-mode=${deepSearch ? "bad-spellers" : "slow"}`,
//       "--lang=en",
//       "--encoding=utf-8",
//     ]);

//     let stdout = "";
//     let stderr = "";

//     child.stdout.setEncoding("utf8");
//     child.stderr.setEncoding("utf8");

//     child.stdout.on("data", (data: string) => {
//       stdout += data;
//     });

//     child.stderr.on("data", (data: string) => {
//       stderr += data;
//     });

//     child.on("error", reject);

//     child.on("close", (code) => {
//       if (code !== 0) {
//         reject(new Error(stderr || `Aspell exited with code ${code}`));
//         return;
//       }

//       const line = stdout
//         .split(/\r?\n/)
//         .find((line) => line.startsWith("&") || line.startsWith("#"));

//       if (!line || line.startsWith("#")) {
//         resolve([]);
//         return;
//       }

//       const match = line.match(/^&\s+.+?\s+\d+\s+\d+:\s*(.*)$/);

//       resolve(match ? match[1].split(/,\s*/) : []);
//     });

//     child.stdin.end(word + "\n");
//   });
// }

// import { spawn } from "node:child_process";
// import { useEffect, useState } from "react";
// import { Action, ActionPanel, List } from "@vicinae/api";

// export default function SimpleList() {
//   const [wordList, setWordList] = useState<string[]>([]);
//   const [deepSearch, setDeepSearch] = useState(false);
//   const [word, setWord] = useState("");
//   const [isLoading, setIsLoading] = useState(false)

//   useEffect(() => {
//     if (!word.trim()) {
//       setWordList([]);
//       return;
//     }

//     const timeout = setTimeout(async () => {
//       try {
//         const suggestions = await suggestCorrections(word, deepSearch);
//         setWordList(suggestions);
//       } catch (error) {
//         console.error("Spellcheck failed:", error);
//         setWordList([]);
//       } finally {
//         setIsLoading(false)
//       }
//     }, 500);

//     // Cancel the timer if the user types again.
//     return () => clearTimeout(timeout);
//   }, [word, deepSearch]);

//   return (
//     <List
//       searchBarPlaceholder="Spell word..."
//       onSearchTextChange={(text) => {
//         setWord(text);
//         setIsLoading(text ? true : false);
//       }}
//       isLoading={isLoading}>
//       {wordList.map((suggestion) => (
//         <List.Item title={suggestion} key={suggestion} actions={
//           <ActionPanel>
//             <Action.CopyToClipboard content={suggestion} />
//             <Action title="Toggle bad spellings" onAction={() => setDeepSearch(!deepSearch)} />
//           </ActionPanel>
//         } />
//       ))}
//     </List>
//   );
// }

// async function suggestCorrections(word: string, deepSearch: boolean): Promise<string[]> {
//   return new Promise((resolve, reject) => {
//     const child = spawn("aspell", [
//       "-a",
//       `--sug-mode=${deepSearch ? "bad-spellers" : "slow"}`,
//       "--lang=en",
//       "--encoding=utf-8",
//     ]);

//     let stdout = "";
//     let stderr = "";

//     child.stdout.setEncoding("utf8");
//     child.stderr.setEncoding("utf8");

//     child.stdout.on("data", (data: string) => {
//       stdout += data;
//     });

//     child.stderr.on("data", (data: string) => {
//       stderr += data;
//     });

//     child.on("error", reject);

//     child.on("close", (code) => {
//       if (code !== 0) {
//         reject(new Error(stderr || `Aspell exited with code ${code}`));
//         return;
//       }

//       const line = stdout
//         .split(/\r?\n/)
//         .find((line) => line.startsWith("&") || line.startsWith("#"));

//       if (!line || line.startsWith("#")) {
//         resolve([]);
//         return;
//       }

//       const match = line.match(/^&\s+.+?\s+\d+\s+\d+:\s*(.*)$/);

//       resolve(match ? match[1].split(/,\s*/) : []);
//     });

//     child.stdin.end(word + "\n");
//   });
// }
