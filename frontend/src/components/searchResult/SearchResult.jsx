import "../../css/search-result.css";
const SearchResult = ({ guidance }) => {
  return (
    <div className="search-result">
      <div className="guidance-section">
        <h3>AI Assistant's Guide</h3>
        <p className="guidance-text">{guidance}</p>
      </div>
    </div>
  );
};

export default SearchResult;