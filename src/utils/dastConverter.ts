import type { JSONContent } from '@tiptap/core';

// ---- DAST type definitions (subset used by rich table cells) ----

export type DastMark =
  | 'strong'
  | 'emphasis'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'highlight';

export type DastSpan = {
  type: 'span';
  value: string;
  marks?: DastMark[];
};

export type DastLink = {
  type: 'link';
  url: string;
  children: DastSpan[];
};

export type DastInlineNode = DastSpan | DastLink;

export type DastParagraph = {
  type: 'paragraph';
  children: DastInlineNode[];
};

export type DastHeading = {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: DastInlineNode[];
};

export type DastListItem = {
  type: 'listItem';
  children: (DastParagraph | DastList)[];
};

export type DastList = {
  type: 'list';
  style: 'bulleted' | 'numbered';
  children: DastListItem[];
};

export type DastBlockNode = DastParagraph | DastHeading | DastList;

export type DastDocument = {
  type: 'root';
  children: DastBlockNode[];
};

export type DastCellValue = {
  schema: 'dast';
  document: DastDocument;
};

export type ImageCellValue = {
  schema: 'image';
  upload: {
    id: string;
    url: string;
    width: number | null;
    height: number | null;
  };
};

export type ButtonCellValue = {
  schema: 'button';
  label: string;
  href: string;
};

export type CellValue = DastCellValue | ImageCellValue | ButtonCellValue;

// ---- Helpers ----

export function emptyCell(): DastCellValue {
  return {
    schema: 'dast',
    document: {
      type: 'root',
      children: [{ type: 'paragraph', children: [] }],
    },
  };
}

export function stringToCellValue(text: string): DastCellValue {
  const trimmed = text.trim();
  if (!trimmed) return emptyCell();
  return {
    schema: 'dast',
    document: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'span', value: trimmed }],
        },
      ],
    },
  };
}

export function isCellValue(data: unknown): data is CellValue {
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    return false;
  const d = data as Record<string, unknown>;

  if (d.schema === 'image') {
    if (typeof d.upload !== 'object' || d.upload === null) return false;
    const u = d.upload as Record<string, unknown>;
    return typeof u.id === 'string' && typeof u.url === 'string';
  }

  if (d.schema === 'button') {
    return typeof d.label === 'string' && typeof d.href === 'string';
  }

  if (d.schema !== 'dast') return false;
  if (
    typeof d.document !== 'object' ||
    d.document === null ||
    Array.isArray(d.document)
  )
    return false;
  return (d.document as Record<string, unknown>).type === 'root';
}

// ---- DAST → Tiptap ----

function markToTiptap(mark: DastMark): { type: string } | null {
  switch (mark) {
    case 'strong':
      return { type: 'bold' };
    case 'emphasis':
      return { type: 'italic' };
    case 'underline':
      return { type: 'underline' };
    case 'strikethrough':
      return { type: 'strike' };
    case 'code':
      return { type: 'code' };
    default:
      return null;
  }
}

function dastInlinesToTiptap(nodes: DastInlineNode[]): JSONContent[] {
  const result: JSONContent[] = [];
  for (const node of nodes) {
    if (node.type === 'span') {
      const marks = (node.marks ?? [])
        .map(markToTiptap)
        .filter((m): m is { type: string } => m !== null);
      result.push({
        type: 'text',
        text: node.value,
        ...(marks.length > 0 ? { marks } : {}),
      });
    } else if (node.type === 'link') {
      const linkMark = {
        type: 'link',
        attrs: { href: node.url, target: null, rel: null, class: null },
      };
      for (const child of node.children) {
        const otherMarks = (child.marks ?? [])
          .map(markToTiptap)
          .filter((m): m is { type: string } => m !== null);
        result.push({
          type: 'text',
          text: child.value,
          marks: [linkMark, ...otherMarks],
        });
      }
    }
  }
  return result;
}

function dastListItemToTiptap(node: DastListItem): JSONContent {
  return {
    type: 'listItem',
    content: node.children
      .map((child) => dastBlockToTiptap(child as DastBlockNode))
      .filter((n): n is JSONContent => n !== null),
  };
}

function dastBlockToTiptap(node: DastBlockNode): JSONContent | null {
  switch (node.type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        content: dastInlinesToTiptap(node.children),
      };
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: node.level },
        content: dastInlinesToTiptap(node.children),
      };
    case 'list':
      return {
        type: node.style === 'bulleted' ? 'bulletList' : 'orderedList',
        content: node.children.map(dastListItemToTiptap),
      };
    default:
      return null;
  }
}

export function dastToTiptap(cell: DastCellValue): JSONContent {
  return {
    type: 'doc',
    content: cell.document.children
      .map(dastBlockToTiptap)
      .filter((n): n is JSONContent => n !== null),
  };
}

// ---- Tiptap → DAST ----

function tiptapMarkToDast(mark: { type: string }): DastMark | null {
  switch (mark.type) {
    case 'bold':
      return 'strong';
    case 'italic':
      return 'emphasis';
    case 'underline':
      return 'underline';
    case 'strike':
      return 'strikethrough';
    case 'code':
      return 'code';
    default:
      return null;
  }
}

function tiptapInlinesToDast(nodes: JSONContent[]): DastInlineNode[] {
  const result: DastInlineNode[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type !== 'text') {
      i++;
      continue;
    }

    const linkMark = node.marks?.find((m) => m.type === 'link');

    if (linkMark) {
      const href = (linkMark.attrs?.href as string) ?? '';
      const linkChildren: DastSpan[] = [];

      while (
        i < nodes.length &&
        nodes[i].marks?.some(
          (m) => m.type === 'link' && (m.attrs?.href as string) === href,
        )
      ) {
        const n = nodes[i];
        const otherMarks = (n.marks ?? []).filter((m) => m.type !== 'link');
        const dastMarks = otherMarks
          .map(tiptapMarkToDast)
          .filter((m): m is DastMark => m !== null);
        linkChildren.push({
          type: 'span',
          value: n.text ?? '',
          ...(dastMarks.length > 0 ? { marks: dastMarks } : {}),
        });
        i++;
      }

      result.push({ type: 'link', url: href, children: linkChildren });
    } else {
      const dastMarks = (node.marks ?? [])
        .map(tiptapMarkToDast)
        .filter((m): m is DastMark => m !== null);
      result.push({
        type: 'span',
        value: node.text ?? '',
        ...(dastMarks.length > 0 ? { marks: dastMarks } : {}),
      });
      i++;
    }
  }

  return result;
}

function tiptapListItemToDast(node: JSONContent): DastListItem | null {
  if (node.type !== 'listItem') return null;
  return {
    type: 'listItem',
    children: (node.content ?? [])
      .map(tiptapNodeToDast)
      .filter(
        (n): n is DastParagraph | DastList =>
          n !== null && (n.type === 'paragraph' || n.type === 'list'),
      ),
  };
}

function tiptapNodeToDast(node: JSONContent): DastBlockNode | null {
  switch (node.type) {
    case 'paragraph':
      return {
        type: 'paragraph',
        children: tiptapInlinesToDast(node.content ?? []),
      };
    case 'heading':
      return {
        type: 'heading',
        level: ((node.attrs?.level as number) ?? 1) as 1 | 2 | 3 | 4 | 5 | 6,
        children: tiptapInlinesToDast(node.content ?? []),
      };
    case 'bulletList':
      return {
        type: 'list',
        style: 'bulleted',
        children: (node.content ?? [])
          .map(tiptapListItemToDast)
          .filter((n): n is DastListItem => n !== null),
      };
    case 'orderedList':
      return {
        type: 'list',
        style: 'numbered',
        children: (node.content ?? [])
          .map(tiptapListItemToDast)
          .filter((n): n is DastListItem => n !== null),
      };
    default:
      return null;
  }
}

export function tiptapToDast(tiptap: JSONContent): DastCellValue {
  return {
    schema: 'dast',
    document: {
      type: 'root',
      children: (tiptap.content ?? [])
        .map(tiptapNodeToDast)
        .filter((n): n is DastBlockNode => n !== null),
    },
  };
}
