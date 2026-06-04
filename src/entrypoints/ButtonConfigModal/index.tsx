import type { RenderModalCtx } from 'datocms-plugin-sdk';
import { Button, Canvas } from 'datocms-react-ui';
import { useState } from 'react';
import type { ButtonCellValue } from '../../types';
import s from './style.module.css';

type Props = {
  ctx: RenderModalCtx;
};

export default function ButtonConfigModal({ ctx }: Props) {
  const initial = ctx.parameters.button as ButtonCellValue | null;
  const [label, setLabel] = useState(initial?.label ?? '');
  const [href, setHref] = useState(initial?.href ?? '');

  const handleSave = () => {
    const value: ButtonCellValue = { schema: 'button', label, href };
    ctx.resolve(value);
  };

  return (
    <Canvas ctx={ctx}>
      <div className={s.form}>
        <div className={s.field}>
          <label className={s.label} htmlFor="btn-label">
            Label
          </label>
          <input
            id="btn-label"
            className={s.input}
            type="text"
            placeholder="e.g. Learn more"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="btn-href">
            URL
          </label>
          <input
            id="btn-href"
            className={s.input}
            type="url"
            placeholder="https://"
            value={href}
            onChange={(e) => setHref(e.target.value)}
          />
        </div>
      </div>
      <div className={s.bar}>
        <Button onClick={() => ctx.resolve('abort')}>Cancel</Button>
        <div className={s.spacer} />
        <Button
          buttonType="primary"
          onClick={handleSave}
          disabled={!label.trim() || !href.trim()}
        >
          Save
        </Button>
      </div>
    </Canvas>
  );
}
