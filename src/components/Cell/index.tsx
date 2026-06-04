import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Dropdown,
  DropdownMenu,
  DropdownOption,
  DropdownSeparator,
  useCtx,
} from 'datocms-react-ui';
import type { Column as TableColumn, Row as TableRow } from 'react-table';
import type { Actions, ButtonCellValue, CellValue, Row } from '../../types';
import { emptyCell } from '../../utils/dastConverter';
import ButtonCell from '../ButtonCell';
import ImageCell from '../ImageCell';
import RichTextCell from '../RichTextCell';
import s from './styles.module.css';

type Props = Actions & {
  value: CellValue;
  row: TableRow<Row>;
  rows: TableRow<Row>[];
  columns: TableColumn<Row>[];
  column: TableColumn<Row>;
};

export default function Cell(props: Props) {
  const ctx = useCtx();
  const {
    value,
    row: { index },
    column: { id },
    onCellUpdate,
  } = props;

  const switchToText = () => {
    onCellUpdate(index, id as string, emptyCell());
  };

  const switchToImage = async () => {
    const upload = await ctx.selectUpload({ multiple: false });
    if (!upload) return;
    onCellUpdate(index, id as string, {
      schema: 'image',
      upload: {
        id: upload.id,
        url: upload.attributes.url,
        width: upload.attributes.width,
        height: upload.attributes.height,
      },
    });
  };

  const switchToButton = async () => {
    const result = await ctx.openModal({
      id: 'button-config',
      title: 'Configure button',
      width: 's',
      parameters: { button: null },
    });
    if (!result || result === 'abort') return;
    onCellUpdate(index, id as string, result as ButtonCellValue);
  };

  return (
    <div className={s.wrapper}>
      {value.schema === 'image' ? (
        <ImageCell {...props} value={value} />
      ) : value.schema === 'button' ? (
        <ButtonCell {...props} value={value} />
      ) : (
        <RichTextCell {...props} value={value} />
      )}

      <Dropdown
        renderTrigger={({ onClick, open }) => (
          <button
            type="button"
            className={`${s.typeToggle} ${open ? s.typeToggleOpen : ''}`}
            onClick={onClick}
            title="Change cell type"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
        )}
      >
        <DropdownMenu>
          <DropdownOption
            onClick={switchToText}
            active={value.schema === 'dast'}
          >
            Text
          </DropdownOption>
          <DropdownOption
            onClick={switchToImage}
            active={value.schema === 'image'}
          >
            Image
          </DropdownOption>
          <DropdownSeparator />
          <DropdownOption
            onClick={switchToButton}
            active={value.schema === 'button'}
          >
            Button
          </DropdownOption>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
