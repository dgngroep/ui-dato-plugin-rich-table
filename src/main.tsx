import { connect } from 'datocms-plugin-sdk';
import ButtonConfigModal from './entrypoints/ButtonConfigModal';
import FieldExtension from './entrypoints/FieldExtension';
import Modal from './entrypoints/Modal';
import { render } from './utils/render';
import 'datocms-react-ui/styles.css';

connect({
  manualFieldExtensions() {
    return [
      {
        id: 'rich-table',
        type: 'editor',
        name: 'Rich Table Editor',
        fieldTypes: ['json'],
      },
    ];
  },
  renderFieldExtension(_id, ctx) {
    render(<FieldExtension ctx={ctx} />);
  },
  renderModal(id, ctx) {
    if (id === 'button-config') {
      render(<ButtonConfigModal ctx={ctx} />);
    } else {
      render(<Modal ctx={ctx} />);
    }
  },
});
