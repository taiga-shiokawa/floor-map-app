import "../../css/search-result.css";
const SearchResult = ({ guidance }) => {
  return (
    <div className="search-result">
      <div className="guidance-section">
        <p className="guidance-text">{guidance}</p>
      </div>
    </div>
  );
};

export default SearchResult;