import { useEffect, useState } from "react";
import {translate} from "../vendor/@iamtraction-translate/src";
import { Detail, getSelectedText } from "@vicinae/api";

export default function ViewTranslate() {
    const [translation, setTranslation] = useState<string>("")
    useEffect(() => {
        async function load() {
            const selectedText = await getSelectedText();
            if (!selectedText) return;
            const response = await simpleTranslate(selectedText)
            console.log(response);
            setTranslation(`**${response}**`)
        }
        load()
    }, [])
    return (
        <Detail markdown={translation} />
    )
}




export async function simpleTranslate(text:string): Promise<any>{
  try {
    const response = await translate(text, { to: 'ar' })
    console.log("response:",response);
    return response.text;
  } catch (error) {
    console.error(error);
  }  
}