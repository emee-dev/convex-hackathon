// "use client";
// import ReactCodeEditor from "@uiw/react-textarea-code-editor";
import { langs } from "@uiw/codemirror-extensions-langs";
import CodeMirror, {
  Decoration,
  DecorationSet,
  EditorView,
  RangeSetBuilder,
  ViewPlugin,
  WidgetType,
} from "@uiw/react-codemirror";
import EventEmitter from "events";

// class ButtonWidget extends WidgetType {
//   private key: string;
//   private value: string;

//   constructor(key: string, value: string) {
//     super();
//     this.key = key;
//     this.value = value;
//   }

//   toDOM(view: EditorView): HTMLElement {
//     const button = document.createElement("button");
//     button.innerText = "AI Explain";
//     button.style.marginLeft = "150px";
//     button.onclick = () => {
//       // Use the url state to make the suggestions or explainer component.
//       alert(`Key: ${this.key}\nValue: ${this.value}`);
//     };
//     return button;
//   }

//   ignoreEvent() {
//     return false;
//   }
// }

// const buttonExtension = ViewPlugin.fromClass(
//   class {
//     decorations: DecorationSet;

//     constructor(view: EditorView) {
//       this.decorations = this.createDecorations(view);
//     }

//     update(update: any) {
//       if (update.docChanged) {
//         this.decorations = this.createDecorations(update.view);
//       }
//     }

//     createDecorations(view: EditorView) {
//       const builder = new RangeSetBuilder<Decoration>();

//       for (let { from, to } of view.visibleRanges) {
//         const text = view.state.doc.sliceString(from, to);
//         // const regex = /(\w+)=(".*?"|[^ ]+)\s*(\/\/.*)?/g;
//         // Updated regex to match both quoted and unquoted values
//         const regex = /(\w+)=("[^"]*"|[^\s#]+)/g;
//         let match;

//         while ((match = regex.exec(text)) !== null) {
//           const [, key, value] = match;
//           const start = from + match.index + key.length + 1 + value.length;
//           const deco = Decoration.widget({
//             widget: new ButtonWidget(key, value),
//             side: 1,
//           });
//           builder.add(start, start, deco);
//         }
//       }

//       return builder.finish();
//     }
//   },
//   {
//     decorations: (v) => v.decorations,
//   }
// );

type CodeEditorProps = {
  content: string;
  editable: boolean;
  placeholder?: string;
  bgcolor?: string;
  // event: EventEmitter;
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

const buttonExtension = (
  buttonLabel: string,
  // event: EventEmitter,
  onClick: (key: string) => void
) =>
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

// const CodeEditor = ({
//   content,
//   editable,
//   bgcolor = "#f5f5f5",
//   placeholder = "Please enter env file content code.",
// }: CodeEditorProps) => {
//   return (
//     <ReactCodeEditor
//       padding={15}
//       language="bash"
//       value={content}
//       disabled={!editable}
//       placeholder={placeholder}
//       style={{
//         padding: "0",
//         fontSize: 14,
//         backgroundColor: bgcolor,
//         width: "100%",
//         fontFamily:
//           "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
//       }}
//     />
//   );
// };

const CodeEditor = ({
  content,
  editable,
  bgcolor = "#f5f5f5",
  // event,
  placeholder = "Please enter env file content code.",
  handleClick,
}: CodeEditorProps) => {
  return (
    <CodeMirror
      value={content}
      editable={editable}
      extensions={[langs.shell(), buttonExtension("AI Explain", handleClick)]}
      placeholder={placeholder}
      // onChange={(v, a) => {
      //   return console.log(v);
      // }}
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
