"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type SkillEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export function SkillEditor({ value = "", onChange }: SkillEditorProps) {
  const [internal, setInternal] = useState(value);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <MonacoEditor
        height="460px"
        defaultLanguage="markdown"
        value={internal}
        onChange={(nextValue) => {
          const safeValue = nextValue ?? "";
          setInternal(safeValue);
          onChange?.(safeValue);
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: "on",
        }}
      />
    </div>
  );
}

