import Editor from "@monaco-editor/react";
import { FileJson, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useConsoleStore } from "../model/use-console-store";

export function EditorPanel() {
  const editorValue = useConsoleStore((state) => state.editorValue);
  const setEditorValue = useConsoleStore((state) => state.setEditorValue);
  const theme = useConsoleStore((state) => state.theme);

  return (
    <Card className="min-h-[460px]">
      <CardHeader className="grid-cols-[1fr_auto] items-start">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="size-4 text-primary" />
            Config
          </CardTitle>
          <CardDescription>Selected pipeline deployment document</CardDescription>
        </div>
        <Button size="sm" variant="outline">
          <Save className="size-4" />
          Save
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Editor
            height="370px"
            language="json"
            theme={theme === "dark" ? "vs-dark" : "light"}
            value={editorValue}
            onChange={(value) => setEditorValue(value ?? "")}
            options={{
              fontSize: 13,
              lineNumbersMinChars: 3,
              minimap: { enabled: false },
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
