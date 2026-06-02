import type { RenderFieldExtensionCtx } from 'datocms-plugin-sdk';
import { Canvas } from 'datocms-react-ui';
import deepEqual from 'fast-deep-equal';
import get from 'lodash-es/get';
import { useEffect, useRef, useState } from 'react';
import { useDeepCompareEffect } from 'use-deep-compare';
import { Empty } from '../../components/Empty';
import TableEditor from '../../components/TableEditor';
import { isValue, type Value } from '../../types';

type Props = {
  ctx: RenderFieldExtensionCtx;
};

type InnerValue = 'invalid' | Value | null;

function toInnerValue(value: string | null): InnerValue {
  if (value === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return 'invalid';
  }

  if (!isValue(parsed)) return 'invalid';
  return parsed;
}

export default function FieldExtension({ ctx }: Props) {
  const rawValue = get(ctx.formValues, ctx.fieldPath) as string | null;
  const [value, setValue] = useState<InnerValue>(toInnerValue(rawValue));
  const pendingChange = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(syncTimer.current), []);

  useDeepCompareEffect(() => {
    const newValue = toInnerValue(rawValue);
    if (deepEqual(newValue, value)) return;
    if (pendingChange.current) {
      pendingChange.current = false;
      return;
    }
    setValue(newValue);
  }, [value]);

  if (value === 'invalid') {
    return <Canvas ctx={ctx}>Invalid value!</Canvas>;
  }

  const handleUpdate = (newValue: Value | null, immediate = false) => {
    pendingChange.current = true;
    setValue(newValue);

    const sync = () =>
      ctx.setFieldValue(
        ctx.fieldPath,
        newValue === null ? null : JSON.stringify(newValue, null, 2),
      );

    if (immediate) {
      clearTimeout(syncTimer.current);
      sync();
    } else {
      clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(sync, 300);
    }
  };

  const handleOpenInFullScreen = async () => {
    const exitValue = (await ctx.openModal({
      id: 'rich-table-editor',
      parameters: { value },
      width: 1900,
      title: 'Edit table',
      closeDisabled: true,
    })) as Value | null | 'abort';

    if (exitValue === 'abort') return;
    handleUpdate(exitValue, true);
  };

  return (
    <Canvas ctx={ctx}>
      {value === null ? (
        <Empty onChange={handleUpdate} />
      ) : (
        <TableEditor
          value={value}
          onChange={handleUpdate}
          onOpenInFullScreen={handleOpenInFullScreen}
        />
      )}
    </Canvas>
  );
}
