import { Button } from 'datocms-react-ui';
import { emptyCell } from '../../utils/dastConverter';
import type { Value } from '../../types';
import s from './style.module.css';

type Props = {
  onChange: (newValue: Value | null) => void;
};

export const Empty = ({ onChange }: Props) => {
  return (
    <div className={s.noValue}>
      <div className={s.noValue_label}>No table present!</div>
      <Button
        buttonSize="s"
        onClick={() => {
          onChange({
            columns: ['Column A', 'Column B'],
            data: [
              {
                'Column A': emptyCell(),
                'Column B': emptyCell(),
              },
            ],
          });
        }}
      >
        Insert new table
      </Button>
    </div>
  );
};
