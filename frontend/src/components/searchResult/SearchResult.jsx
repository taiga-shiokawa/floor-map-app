import "../../css/search-result.css";
// SearchResult.jsx
const SearchResult = ({ guidance }) => {
  const isError = guidance.includes('エラー') || guidance.includes('見つかりません');
  
  return (
    <div className="search-result">
      <div className={`guidance-section ${isError ? 'error' : ''}`}>
        <p className="guidance-text">{guidance}</p>
      </div>
    </div>
  );
};

export default SearchResult;