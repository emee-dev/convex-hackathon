// "use client";
import { langs } from "@uiw/codemirror-extensions-langs";
import CodeMirror, {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  WidgetType,
} from "@uiw/react-codemirror";
import { useCodeEditor } from "./header";

type CodeEditorProps = {
  bgcolor?: string;
  placeholder?: string;
  handleClick: (key: string) => void;
};

class ButtonWidget extends WidgetType {
  private key: string;
  private value: string;
  private buttonLabel: string;
  // private event: EventEmitter | null = null;
  private onClick: () => void;

  constructor(
    key: string,
    value: string,
    buttonLabel: string,
    // event: EventEmitter,
    onClick: () => void
  ) {
    super();
    this.key = key;
    this.value = value;
    this.buttonLabel = buttonLabel;
    // this.event = event;
    this.onClick = onClick;
  }

  toDOM(view: EditorView): HTMLElement {
    const button = document.createElement("button");
    button.innerText = this.buttonLabel;
    button.style.marginLeft = "25%";

    // Emit an event when button is clicked
    button.onclick = this.onClick;

    // Also listen for a disable event to disable all AI explain buttons.

    return button;
  }

  ignoreEvent() {
    return false;
  }
}

const buttonExtension = (buttonLabel: string, onClick: (key: string) => void) =>
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.createDecorations(view);
      }

      update(update: any) {
        if (update.docChanged) {
          this.decorations = this.createDecorations(update.view);
        }
      }

      createDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();

        for (let { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to);
          const regex = /(\w+)=("[^"]*"|[^\s#]+)/g;
          let match;

          while ((match = regex.exec(text)) !== null) {
            const [, key, value] = match;
            const start = from + match.index + key.length + 1 + value.length;
            const deco = Decoration.widget({
              widget: new ButtonWidget(key, value, buttonLabel, () =>
                onClick(key)
              ),
              side: 1,
            });
            builder.add(start, start, deco);
          }
        }

        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

const CodeEditor = ({
  bgcolor = "#f5f5f5",
  placeholder = "Please enter env file content code.",
  handleClick,
}: CodeEditorProps) => {
  const { editable, editorContent, setEditorContent } = useCodeEditor();

  return (
    <CodeMirror
      value={editorContent}
      editable={editable}
      onChange={(val) => setEditorContent(val)}
      extensions={[langs.shell(), buttonExtension("AI Explain", handleClick)]}
      placeholder={placeholder}
      style={{
        padding: "0",
        fontSize: 14,
        backgroundColor: bgcolor,
        width: "100%",
        fontFamily:
          "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
      }}
    />
  );
};

export default CodeEditor;
