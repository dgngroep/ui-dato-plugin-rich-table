import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { dequal } from 'dequal';
import { useEffect, useRef } from 'react';
import type { Column as TableColumn, Row as TableRow } from 'react-table';
import type { Actions, CellValue, Row } from '../../types';
import { dastToTiptap, tiptapToDast } from '../../utils/dastConverter';
import s from './styles.module.css';

type Props = Actions & {
  value: CellValue;
  row: TableRow<Row>;
  rows: TableRow<Row>[];
  columns: TableColumn<Row>[];
  column: TableColumn<Row>;
};

export default function RichTextCell({
  value,
  row: { index },
  column: { id },
  onCellUpdate,
  onMultipleCellUpdate,
}: Props) {
  const isSyncing = useRef(false);
  const onCellUpdateRef = useRef(onCellUpdate);
  const onMultipleCellUpdateRef = useRef(onMultipleCellUpdate);
  const prevValueRef = useRef(value);

  useEffect(() => {
    onCellUpdateRef.current = onCellUpdate;
  });
  useEffect(() => {
    onMultipleCellUpdateRef.current = onMultipleCellUpdate;
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
    ],
    content: dastToTiptap(value),
    onUpdate: ({ editor: e }) => {
      if (isSyncing.current) return;
      const dast = tiptapToDast(e.getJSON());
      onCellUpdateRef.current(index, id as string, dast);
    },
  });

  // Sync value changes from external sources (e.g. multi-cell paste)
  useEffect(() => {
    if (!editor) return;
    if (dequal(prevValueRef.current, value)) return;
    prevValueRef.current = value;

    isSyncing.current = true;
    editor.commands.setContent(dastToTiptap(value), false);
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, [editor, value]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const html = e.clipboardData.getData('text/html');
    const plain = e.clipboardData.getData('text/plain');

    // HTML table paste → expand to multiple cells
    if (html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const tableEl = doc.querySelector('table');
      if (tableEl) {
        const table = Array.from(tableEl.rows).map((row) =>
          Array.from(row.children).map(
            (col) =>
              col.textContent?.replace(/\n/g, ' ').replace(/\s+/, ' ').trim() ??
              '',
          ),
        );
        if (table.length > 1 || (table[0]?.length ?? 0) > 1) {
          e.preventDefault();
          onMultipleCellUpdateRef.current(index, id as string, table);
          return;
        }
      }
    }

    // TSV paste → expand to multiple cells
    if (plain.includes('\t')) {
      const table = plain
        .trim()
        .split(/\r\n|\n|\r/)
        .map((row) => row.split('\t'));
      if (table.length > 1 || (table[0]?.length ?? 0) > 1) {
        e.preventDefault();
        onMultipleCellUpdateRef.current(index, id as string, table);
        return;
      }
    }

    // Otherwise let Tiptap handle the paste (handles rich text natively)
  };

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previousUrl ?? '');
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  };

  return (
    <div className={s.cell} onPaste={handlePaste}>
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100, placement: 'top-start' }}
        >
          <div className={s.bubbleMenu}>
            <button
              type="button"
              className={editor.isActive('bold') ? s.isActive : undefined}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleBold().run();
              }}
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              className={editor.isActive('italic') ? s.isActive : undefined}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleItalic().run();
              }}
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              className={editor.isActive('underline') ? s.isActive : undefined}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleUnderline().run();
              }}
              title="Underline"
            >
              U
            </button>
            <div className={s.separator} />
            <button
              type="button"
              className={
                editor.isActive('heading', { level: 1 }) ? s.isActive : undefined
              }
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }}
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              className={
                editor.isActive('heading', { level: 2 }) ? s.isActive : undefined
              }
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              }}
              title="Heading 2"
            >
              H2
            </button>
            <div className={s.separator} />
            <button
              type="button"
              className={editor.isActive('bulletList') ? s.isActive : undefined}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleBulletList().run();
              }}
              title="Bullet list"
            >
              •
            </button>
            <button
              type="button"
              className={editor.isActive('orderedList') ? s.isActive : undefined}
              onMouseDown={(e) => {
                e.preventDefault();
                editor.chain().focus().toggleOrderedList().run();
              }}
              title="Numbered list"
            >
              1.
            </button>
            <div className={s.separator} />
            <button
              type="button"
              className={editor.isActive('link') ? s.isActive : undefined}
              onMouseDown={(e) => {
                e.preventDefault();
                setLink();
              }}
              title="Link"
            >
              ↗
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} className={s.editor} />
    </div>
  );
}
