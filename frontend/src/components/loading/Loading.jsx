import "../../css/loading.css";
const Loading = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p>AI is analyzing the floor map...</p>
      </div>
    </div>
  );
};

export default Loading;