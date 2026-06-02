import type { RenderModalCtx } from 'datocms-plugin-sdk';
import { Button, Canvas } from 'datocms-react-ui';
import { useState } from 'react';
import { Empty } from '../../components/Empty';
import TableEditor from '../../components/TableEditor';
import type { Value } from '../../types';
import s from './style.module.css';

type Props = {
  ctx: RenderModalCtx;
};

export default function Modal({ ctx }: Props) {
  const [value, setValue] = useState<Value | null>(
    ctx.parameters.value as Value,
  );

  return (
    <Canvas ctx={ctx}>
      {value === null ? (
        <Empty onChange={setValue} />
      ) : (
        <TableEditor value={value} onChange={setValue} />
      )}
      <div className={s.bar}>
        <Button onClick={() => ctx.resolve('abort')}>Cancel</Button>
        <div className={s.barSpacer} />
        <Button buttonType="primary" onClick={() => ctx.resolve(value)}>
          Save and close
        </Button>
      </div>
    </Canvas>
  );
}
