```javascript
// Display error message to user
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.style.display = 'block';
  errorDiv.innerHTML = `<p>Error: ${message}</p><p>Check the console (F12) for details.</p>`;
  console.error(message);
}

// Fetch and parse CSV
async function loadCSV() {
  try {
    const response = await fetch('data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch data.csv: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    if (!csvText.trim()) {
      throw new Error('data.csv is empty');
    }
    console.log('CSV loaded successfully');
    return parseCSV(csvText);
  } catch (error) {
    showError(`Could not load CSV file: ${error.message}`);
    return [];
  }
}

function parseCSV(csv) {
  try {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV has no data rows');
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(val => val.trim());
      if (values.length !== headers.length) {
        console.warn(`Skipping malformed row: ${line}`);
        return null;
      }
      return headers.reduce((obj, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
    }).filter(row => row !== null);
    console.log(`Parsed ${rows.length} videos from CSV`);
    return rows;
  } catch (error) {
    showError(`CSV parsing failed: ${error.message}`);
    return [];
  }
}

// Main function to set up video feed
async function setupVideoFeed() {
  console.log('Setting up video feed...');
  const videos = await loadCSV();
  const videoFeed = document.getElementById('videoFeed');

  if (videos.length === 0) {
    showError('No videos loaded. Check if data.csv exists and contains valid data.');
    return;
  }

  // Create video elements
  videos.forEach((video, index) => {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'relative w-full h-full flex items-center justify-center';
    videoWrapper.innerHTML = `
      <video class="video-container" data-index="${index}" playsinline>
        <source src="${video.url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
        <p><strong>${video.title || 'Untitled'}</strong></p>
        <p>${video.how_long_ago || 'Unknown time'} • ${video.size_formatted || 'Unknown size'}</p>
      </div>
    `;
    videoFeed.appendChild(videoWrapper);
  });
  console.log(`Created ${videos.length} video elements`);

  // Video playback and navigation
  const videoElements = document.querySelectorAll('video');
  let currentVideoIndex = 0;

  const playVideo = (index) => {
    videoElements.forEach((video, i) => {
      video.pause();
      if (i === index) {
        video.currentTime = 0;
        video.play().catch(err => {
          showError(`Failed to play video ${videos[i].title || 'Untitled'}: ${err.message}`);
        });
      }
    });
    console.log(`Playing video ${index + 1}/${videoElements.length}`);
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
