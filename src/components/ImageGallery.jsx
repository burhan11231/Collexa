import React from 'react';
import ImageCard from './ImageCard';
import Masonry from 'react-masonry-css';

function ImageGallery({ images }) {
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 2,
  };

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </Masonry>
  );
}

export default ImageGallery;
