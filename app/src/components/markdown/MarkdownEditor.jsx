import React, { useRef } from "react";
import {
  AdmonitionDirectiveDescriptor,
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeAdmonitionType,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  directivesPlugin,
  headingsPlugin,
  imagePlugin,
  InsertAdmonition,
  InsertImage,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  Separator,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import styles from "./MarkdownEditor.module.css";

function whenInAdmonition(editorInFocus) {
  const node = editorInFocus?.rootNode;
  if (!node || node.getType() !== "directive") {
    return false;
  }

  return ["note", "tip", "danger", "info", "caution"].includes(
    node.getMdastNode().name
  );
}

export const MarkdownEditor = ({
  value: initialValue,
  onChange,
  placeholder,
}) => {
  const ref = useRef();

  const handleChange = (value) => {
    onChange(value);
  };

  return (
    <MDXEditor
      placeholder={placeholder}
      markdown={initialValue || ""}
      ref={ref}
      onChange={handleChange}
      plugins={[
        directivesPlugin({
          directiveDescriptors: [AdmonitionDirectiveDescriptor],
        }),

        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        listsPlugin(),
        markdownShortcutPlugin(),
        imagePlugin(),

        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <Separator />
              <BoldItalicUnderlineToggles />
              <CreateLink />
              <CodeToggle />
              <BlockTypeSelect />
              <InsertImage />

              <Separator />
              <ConditionalContents
                options={[
                  {
                    when: whenInAdmonition,
                    contents: () => <ChangeAdmonitionType />,
                  },
                  { fallback: () => <InsertAdmonition /> },
                ]}
              />

              {/* <ChangeAdmonitionType /> */}
            </>
          ),
        }),
      ]}
      className={styles.mde}
    />
  );
};

/*

 <MDXEditor
        placeholder="A description of the resource"
        markdown="# Hello World"
        plugins={[
          headingsPlugin(),
          toolbarPlugin({
            toolbarContents: () => <UndoRedo />,
          }),
        ]}
        className=
      />

*/
