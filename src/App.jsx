import React, { useState, useEffect } from 'react';
import ImageGallery from './components/ImageGallery';
import SearchBar from './components/SearchBar';
import './App.css';
import axios from 'axios';

const UNSPLASH_API_KEY = import.meta.env.VITE_UNSPLASH_API_KEY;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

const defaultKeywords = [
  'Islamic', 'shopping', 'marketing', 'places', 'landscapes',
  'art', 'quotes', 'space', 'products', 'backgrounds'
];

// Function to deeply clean the data
const cleanData = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  } else if (typeof data === 'object' && data !== null) {
    const cleanedObject = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
          cleanedObject[key] = value;
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          cleanedObject[key] = cleanData(value);
        }
      }
    }
    return cleanedObject;
  }
  return data;
};

// Function to aggressively clean Pexels data
const cleanPexelsData = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => cleanPexelsData(item));
  } else if (typeof data === 'object' && data !== null) {
    const cleanedObject = {};
    for (const key in data) {
      if (['id', 'url', 'alt', 'src'].includes(key)) {
        cleanedObject[key] = data[key];
      }
    }
    return cleanedObject;
  }
  return data;
};

async function fetchUnsplashImages(searchTerm, page, retryCount = 0) {
    let apiUrl = '';
    let keyword = defaultKeywords[Math.floor(Math.random() * defaultKeywords.length)]; // Get random keyword here
    if (searchTerm) {
        apiUrl = `https://api.unsplash.com/search/photos?client_id=${UNSPLASH_API_KEY}&query=${searchTerm}&per_page=10&page=${page}`;
    } else {
        apiUrl = `https://api.unsplash.com/search/photos?client_id=${UNSPLASH_API_KEY}&query=${keyword}&per_page=10&page=${page}`;
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const results = searchTerm ? data.results : data.results; //use data.results for unsplash
        console.log(`Unsplash API response with keyword ${keyword}:`, data); // Debug

        if (!results || results.length === 0) { // Check for empty results
            console.warn(`No results found for Unsplash with keyword: ${keyword}`); // Debug
            if (retryCount < 3) {
                console.log(`Retrying Unsplash with a different keyword (retry count: ${retryCount + 1})`);
                return fetchUnsplashImages(searchTerm, page, retryCount + 1); // Recursive call to retry
            } else {
                console.warn("Max retries reached for Unsplash.  Returning empty array.");
                return []; // Return an empty array if no results after retries
            }
        }

        return results.map((image) => ({
            id: image.id,
            url: image.urls.regular,
            alt_description: image.alt_description,
            platform: 'Unsplash',
        }));
    } catch (error) {
        console.error('Error fetching Unsplash images:', error);
        if (retryCount < 3) {
            console.log(`Retrying Unsplash due to error (retry count: ${retryCount + 1})`);
            return fetchUnsplashImages(searchTerm, page, retryCount + 1); // Retry on error as well
        } else {
             console.warn("Max retries reached for Unsplash after error.  Returning empty array.");
            return [];
        }
    }
}

async function fetchPexelsImages(searchTerm, page, retryCount = 0) {
    let apiUrl = '';
    let keyword = defaultKeywords[Math.floor(Math.random() * defaultKeywords.length)]; //Get random keyword here
    if (searchTerm) {
        apiUrl = `https://api.pexels.com/v1/search?query=${searchTerm}&per_page=10&page=${page}`;
    } else {
        apiUrl = `https://api.pexels.com/v1/search?query=${keyword}&per_page=10&page=${page}`;
    }

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: PEXELS_API_KEY,
            },
        });
        console.log(`Pexels API response with keyword ${keyword}:`, response.data);  //Debug
        // Clean the Pexels data aggressively
        if (!response.data.photos || response.data.photos.length === 0) { // Check for empty results
            console.warn(`No results found for Pexels with keyword: ${keyword}`); // Debug
            if (retryCount < 3) {
                console.log(`Retrying Pexels with a different keyword (retry count: ${retryCount + 1})`);
                return fetchPexelsImages(searchTerm, page, retryCount + 1); // Recursive call to retry
            } else {
                console.warn("Max retries reached for Pexels. Returning empty array.");
                return []; // Return an empty array if no results after retries
            }
        }

        const cleanedPexelsImages = response.data.photos.map((image) => {
            const cleanedImage = cleanPexelsData(image);
            return {
                id: cleanedImage.id,
                url: cleanedImage.src?.large2x || cleanedImage.src?.large || cleanedImage.src?.regular || cleanedImage.url, // Prioritize higher resolution
                alt_description: cleanedImage.alt,
                platform: 'Pexels',
            };
        });

        return cleanedPexelsImages;
    } catch (error) {
        console.error('Error fetching Pexels images:', error);
        if (retryCount < 3) {
            console.log(`Retrying Pexels due to error (retry count: ${retryCount + 1})`);
            return fetchPexelsImages(searchTerm, page, retryCount + 1); // Retry on error as well
        } else {
            console.warn("Max retries reached for Pexels after error. Returning empty array.");
            return [];
        }
    }
}

function App() {
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadImages();
  }, [page, searchTerm]);

  const loadImages = async () => {
    setIsLoading(true);

    try {
      const unsplashImages = await fetchUnsplashImages(searchTerm, page);
      const pexelsImages = await fetchPexelsImages(searchTerm, page);

      const combinedImages = [...unsplashImages, ...pexelsImages];
      const cleanedImages = cleanData(combinedImages);
      console.log("Cleaned Images:", cleanedImages); // Debugging line - CHECK THIS FIRST

      // Replace the entire state with the new images
      setImages((prevImages) => (page === 1 ? cleanedImages : [...prevImages, ...cleanedImages]));
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setImages([]); // Clear existing images
    setPage(1); // Reset page to 1 for new search
  };

  const loadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="app-title">Collexa</h1>
        <SearchBar onSearch={handleSearch} />
      </header>
      <ImageGallery images={images} />
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <button className="load-more-button" onClick={loadMore}>
          Load More
        </button>
      )}
    </div>
  );
}

export default App;
