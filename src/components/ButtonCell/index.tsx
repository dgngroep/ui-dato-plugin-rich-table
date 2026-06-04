import { faExternalLinkAlt, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCtx } from 'datocms-react-ui';
import type { Column as TableColumn, Row as TableRow } from 'react-table';
import type { Actions, ButtonCellValue, Row } from '../../types';
import s from './styles.module.css';

type Props = Actions & {
  value: ButtonCellValue;
  row: TableRow<Row>;
  column: TableColumn<Row>;
};

export default function ButtonCell({
  value,
  row: { index },
  column: { id },
  onCellUpdate,
}: Props) {
  const ctx = useCtx();

  const handleEdit = async () => {
    const result = await ctx.openModal({
      id: 'button-config',
      title: 'Configure button',
      width: 's',
      parameters: { button: value },
    });
    if (!result || result === 'abort') return;
    onCellUpdate(index, id as string, result as ButtonCellValue);
  };

  return (
    <div className={s.cell}>
      <div className={s.chip}>
        <span className={s.badge}>Button</span>
        <div className={s.content}>
          <span className={s.cellLabel}>{value.label || <em>No label</em>}</span>
          {value.href && (
            <span className={s.href}>
              <FontAwesomeIcon icon={faExternalLinkAlt} className={s.hrefIcon} />
              {value.href}
            </span>
          )}
        </div>
      </div>
      <button type="button" className={s.editBtn} onClick={handleEdit} title="Edit button">
        <FontAwesomeIcon icon={faPencilAlt} />
      </button>
    </div>
  );
}
