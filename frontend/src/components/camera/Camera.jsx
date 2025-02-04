// components/Camera.jsx
import { useRef, useState, useEffect } from 'react';
import '../../css/camera.css';

const Camera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // カメラの起動
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } // 背面カメラを優先
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();

    // クリーンアップ
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // 画像をBlobに変換
    canvas.toBlob((blob) => {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      onCapture(file);
      
      // カメラを停止
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }, 'image/jpeg');
  };

  return (
    <div className="camera-overlay">
      <div className="camera-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="camera-preview"
        />
        <div className="camera-controls">
          <button onClick={onClose} className="camera-button cancel">
            Cancel
          </button>
          <button onClick={handleCapture} className="camera-button capture">
            Take Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default Camera;