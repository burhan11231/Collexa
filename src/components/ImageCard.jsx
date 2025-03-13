import React, { useState, useEffect } from "react";

function ImageCard({ image }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = image.url;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(false);
  }, [image.url]);

  const downloadImage = async () => {
  try {
    const proxyUrl = `http://localhost:5173/proxy?url=${encodeURIComponent(image.url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `image-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading image:", error);
    alert("Failed to download the image.");
  }
};


  return (
    <div className="image-card" style={{ position: "relative" }}>
      {image.url && (
        <img
          src={image.url}
          alt={image.alt_description}
          style={{
            maxWidth: "100%",
            maxHeight: "200px",
            display: "block",
            objectFit: "cover",
          }}
        />
      )}
      <div className="platform-tag">{image.platform}</div>
      <button
        className="download-button"
        onClick={downloadImage}
        disabled={!imageLoaded}
      >
        Download
      </button>
      {!imageLoaded && <p>Loading image...</p>}
    </div>
  );
}

export default ImageCard;
