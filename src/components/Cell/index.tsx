import { faFileImage, faFont } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCtx } from 'datocms-react-ui';
import type { Column as TableColumn, Row as TableRow } from 'react-table';
import type { Actions, CellValue, Row } from '../../types';
import { emptyCell } from '../../utils/dastConverter';
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

  const switchToText = () => {
    onCellUpdate(index, id as string, emptyCell());
  };

  const isImage = value.schema === 'image';

  return (
    <div className={s.wrapper}>
      {isImage ? (
        <ImageCell {...props} value={value} />
      ) : (
        <RichTextCell {...props} value={value} />
      )}
      <button
        type="button"
        className={s.typeToggle}
        onClick={isImage ? switchToText : switchToImage}
        title={isImage ? 'Switch to text' : 'Switch to image'}
      >
        <FontAwesomeIcon icon={isImage ? faFont : faFileImage} />
      </button>
    </div>
  );
}
