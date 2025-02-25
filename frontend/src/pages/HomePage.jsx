import { useRef, useState } from "react";
import "../css/home-page.css";
import apiRequest from "../lib/apiRequest";
import Camera from "../components/camera/Camera";
import Loading from "../components/loading/Loading";
import ModalSearchResult from "../components/modal/ModalSearchResult";

const HomePage = () => {
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [storeQuery, setStoreQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage({ file, preview: imageUrl });
    }
  };

  const handlePhotoCapture = (file) => {
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage({ file, preview: imageUrl });
    setShowCamera(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage || !storeQuery) return;

    const formData = new FormData();
    formData.append("image", selectedImage.file);
    formData.append("store", storeQuery);

    try {
      setIsLoading(true);
      const response = await apiRequest.post("/upload/floor-map", formData);
      
      // 成功・失敗に関わらず、レスポンスをそのままsearchResultにセット
      setSearchResult(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error uploading image:", error);
      // エラー時のsearchResultをセット
      setSearchResult({
        success: false,
        guidance: "エラーが発生しました。もう一度、正確な店舗名でお試しください。"
      });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="home">
      <section className="hero">
      <h1>
        目的地をすぐに
        <br className="phone-break" />
        <span className="phone">見つけよう</span>
      </h1>
        <p>
        フロアマップをアップロードまたは写真に撮ると、AI によるテキスト認識を使用して目的の店舗を即座に検索できます。
        </p>
      </section>

      <section className="camera-section">
        <div className="camera-container">
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="file-input"
              name="image"
            />
            {!selectedImage ? (
              <div className="upload-options">
                <button
                  type="button"
                  className="upload-button"
                  onClick={handleButtonClick}
                >
                  <span className="button-icon">📁</span>
                  アップロード
                </button>
                
                <div className="divider">
                  <span>or</span>
                </div>
                
                <button
                  type="button"
                  className="camera-button"
                  onClick={() => setShowCamera(true)}
                >
                  <span className="button-icon">📷</span>
                  カメラを起動
                </button>
              </div>
            ) : (
              <div className="preview-section">
                <img
                  src={selectedImage.preview}
                  alt="Floor map preview"
                  className="image-preview"
                />
                <div className="store-query-section">
                  <div className="upload-options">
                    <p>選び直す</p>
                    <button
                      type="button"
                      className="upload-button"
                      onClick={handleButtonClick}
                    >
                      <span className="button-icon">📁</span>
                      アップロード
                    </button>
                    
                    <div className="divider">
                      <span>or</span>
                    </div>
                    
                    <button
                      type="button"
                      className="camera-button"
                      onClick={() => setShowCamera(true)}
                    >
                      <span className="button-icon">📷</span>
                      カメラを起動
                    </button>
                  </div>
                  <input
                    type="text"
                    value={storeQuery}
                    onChange={(e) => setStoreQuery(e.target.value)}
                    placeholder="店舗名を入力"
                    className="store-input"
                    name="store"
                  />
                  <p className="store-search-tips">※正式名称を入力するとより正確に検索できます。</p>
                  <button type="submit" className="search-button">
                    検索
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {searchResult && (
        <ModalSearchResult
          guidance={searchResult.guidance}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {showCamera && (
        <Camera
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {isLoading && <Loading />}
    </div>
  );
};

export default HomePage;