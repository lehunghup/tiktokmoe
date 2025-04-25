```javascript
// Fetch and parse CSV
async function loadCSV() {
  try {
    const response = await fetch('data.csv');
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',').map(val => val.trim());
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i];
      return obj;
   >, {});
  });
}

// Main function to set up video feed
async function setupVideoFeed() {
  const videos = await loadCSV();
  const videoFeed = document.getElementById('videoFeed');

  // Create video elements
  videos.forEach((video, index) => {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'relative w-full h-full flex items-center justify-center';
    videoWrapper.innerHTML = `
      <video class="video-container" data-index="${index}" playsinline>
        <source src="${video.url}" type="video/mp4">
      </video>
      <div class="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
        <p><strong>${video.title}</strong></p>
        <p>${video.how_long_ago} • ${video.size_formatted}</p>
      </div>
    `;
    videoFeed.appendChild(videoWrapper);
  });

  // Video playback and navigation
  const videoElements = document.querySelectorAll('video');
  let currentVideoIndex = 0;

  const playVideo = (index) => {
    videoElements.forEach((video, i) => {
      video.pause();
      if (i === index) {
        video.currentTime = 0;
        video.play().catch(err => console.error('Playback error:', err));
      }
    });
  };

  // Auto-play next video when current ends
  videoElements.forEach(video => {
    video.addEventListener('ended', () => {
      currentVideoIndex = (currentVideoIndex + 1) % videos.length;
      videoFeed.scrollTo({ top: currentVideoIndex * window.innerHeight, behavior: 'smooth' });
      playVideo(currentVideoIndex);
    });
  });

  // Swipe detection
  let touchStartY = 0;
  let touchEndY = 0;

  videoFeed.addEventListener('touchstart', e => {
    touchStartY = e.changedTouches[0].screenY;
  });

  videoFeed.addEventListener('touchend', e => {
    touchEndY = e.changedTouches[0].screenY;
    const deltaY = touchStartY - touchEndY;
    if (Math.abs(deltaY) > 50) { // Swipe threshold
      if (deltaY > 0 && currentVideoIndex < videos.length - 1) {
        currentVideoIndex++;
      } else if (deltaY < 0 && currentVideoIndex > 0) {
        currentVideoIndex--;
      }
      videoFeed.scrollTo({ top: currentVideoIndex * window.innerHeight, behavior: 'smooth' });
      playVideo(currentVideoIndex);
    }
  });

  // Intersection Observer to detect visible video
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index);
          if (index !== currentVideoIndex) {
            currentVideoIndex = index;
            playVideo(currentVideoIndex);
          }
        }
      });
    },
    { threshold: 0.5 }
  );

  videoElements.forEach(video => observer.observe(video));

  // Initial play
  playVideo(currentVideoIndex);

  // Handle window resize
  window.addEventListener('resize', () => {
    videoFeed.scrollTo({ top: currentVideoIndex * window.innerHeight, behavior: 'instant' });
  });
}

// Run setup
setupVideoFeed();
```