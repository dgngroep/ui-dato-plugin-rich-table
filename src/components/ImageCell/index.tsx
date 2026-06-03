import { useCtx } from 'datocms-react-ui';
import type { Column as TableColumn, Row as TableRow } from 'react-table';
import type { Actions, ImageCellValue, Row } from '../../types';
import s from './styles.module.css';

type Props = Actions & {
  value: ImageCellValue;
  row: TableRow<Row>;
  column: TableColumn<Row>;
};

export default function ImageCell({
  value,
  row: { index },
  column: { id },
  onCellUpdate,
}: Props) {
  const ctx = useCtx();

  const handleChange = async () => {
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

  return (
    <div className={s.imageCell}>
      <img
        src={value.upload.url}
        alt=""
        className={s.image}
      />
      <div className={s.overlay}>
        <button type="button" onClick={handleChange} className={s.changeBtn}>
          Change
        </button>
      </div>
    </div>
  );
}
