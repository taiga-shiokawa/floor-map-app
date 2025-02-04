import SearchResult from "../searchResult/SearchResult";
import Modal from "./Modal";
import "../../css/modal-search-result.css"

const ModalSearchResult = ({ guidance, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal-search-result">
        <h2 className="modal-search-result__title">Store Location Guide</h2>
        <div className="modal-search-result__content">
          <SearchResult guidance={guidance} />
        </div>
        <button
          onClick={onClose}
          className="modal-search-result__close-button"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ModalSearchResult;