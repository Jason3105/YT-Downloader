import React, { useState, useEffect, createContext, useContext, useRef } from 'react';

// Theme Context
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yt-theme');
      if (stored) return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('yt-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Icons
const SunIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg className="w-8 h-8" fill="#FF0000" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const PlayIcon = () => (
  <svg className="w-16 h-16" fill="white" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

// Updated VideoAPI for real functionality
const API_URL = 'https://yt-downloader-backend-v5zz.onrender.com' || 'http://localhost:5000';

const VideoAPI = {
  async getVideoInfo(url) {
    try {
      const response = await fetch(`${API_URL}/api/video-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch video info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching video info:', error);
      throw error;
    }
  },

  async downloadVideo(url, options) {
    try {
      const response = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...options })
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Get the filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      } else if (options.format) {
        filename = `download.${options.format}`;
      }
      
      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true };
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
};



// Header Component
const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <YouTubeIcon />
          <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
            YT Downloader
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-neutral-200 hover:text-red-600 transition-colors">Features</a>
          <a href="#how-it-works" className="text-neutral-200 hover:text-red-600 transition-colors">How It Works</a>
          
        </div>

        <div className="md:hidden">
         
        </div>
      </nav>
    </header>
  );
};

// Hero Section
const HeroSection = ({ url, setUrl, onFetch, isLoading }) => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
      style={{
        backgroundImage: `url('/hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-white ">
            Download Any Video
          </h1>
          <p className="text-xl md:text-2xl text-neutral-300 mb-12 leading-relaxed">
            Fast, reliable, and high-quality YouTube downloads.<br />
            No ads. No limits. Just paste your link and go!
          </p>
        </div>

        <div className="animate-fade-in-up animation-delay-300">
          <div className="bg-neutral-900/80 rounded-3xl p-8 border border-neutral-800 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your video URL here..."
                className="flex-1 px-6 py-4 rounded-2xl bg-neutral-800 text-white placeholder-neutral-500 border-0 outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
              <button
                onClick={onFetch}
                disabled={isLoading || !url}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </div>
                ) : (
                  'Get Video'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
};

// Video Preview Card
const VideoPreviewCard = ({ video, onHide, url }) => {
  const videoId = getYouTubeId(url);

  return (
    <div className="animate-fade-in-up bg-white dark:bg-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="relative group">
        {videoId ? (
          <iframe
            width="100%"
            height="320"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-80 rounded-t-3xl"
          ></iframe>
        ) : (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-64 md:h-80 object-cover"
          />
        )}
        <button
          onClick={onHide}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          ×
        </button>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3 line-clamp-2">
          {video.title}
        </h3>
        <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400 mb-4">
          <span className="font-medium">{video.channel}</span>
          <span>•</span>
          <span>{video.views}</span>
          <span>•</span>
          <span>{video.uploadDate}</span>
        </div>
        <p className="text-neutral-700 dark:text-neutral-300 mb-4 line-clamp-3">
          {video.description}
        </p>
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-full">
            Duration: {video.duration}
          </span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Format Selector
const FormatSelector = ({ video, selectedFormat, onFormatChange, onDownload, isDownloading }) => {
  // Show all video formats (video+audio and video-only)
  const videoFormats = React.useMemo(() => {
    const allVideo = video?.formats?.video || [];
    // Remove duplicates by itag
    return allVideo
      .filter((f, idx, arr) => arr.findIndex(ff => ff.itag === f.itag) === idx)
      .sort((a, b) => {
        // Sort by qualityLabel (e.g., 2160p > 1440p > 1080p > 720p > ...)
        const getNum = q => parseInt(q?.quality?.replace(/\D/g, '') || q?.qualityLabel?.replace(/\D/g, '') || 0, 10);
        return getNum(b) - getNum(a);
      });
  }, [video]);

  // For audio: prefer m4a, else all unique audio-only formats
  const audioFormats = React.useMemo(() => {
    const allAudio = video?.formats?.audio || [];
    const m4a = allAudio.filter(f => f.format === 'm4a');
    return m4a.length > 0 ? m4a : allAudio;
  }, [video]);

  const currentFormats = selectedFormat === 'video' ? videoFormats : audioFormats;

  const [selectedItag, setSelectedItag] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setSelectedItag(currentFormats[0]?.itag || '');
  }, [currentFormats]);

  const selectedFormatData = currentFormats.find(f => f.itag === selectedItag) || currentFormats[0];

  const renderFormatOptions = () => {
    if (currentFormats.length > 4) {
      return (
        <div className="relative">
          <button
            className="w-full p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-left flex justify-between items-center"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            type="button"
          >
            <span>
              {selectedFormatData.quality} ({selectedFormatData.format?.toUpperCase()})
            </span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute z-10 mt-2 w-full bg-white dark:bg-neutral-700 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-600 max-h-60 overflow-y-auto">
              {currentFormats.map(format => (
                <button
                  key={format.itag}
                  onClick={() => {
                    setSelectedItag(format.itag);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl ${
                    selectedItag === format.itag ? 'bg-red-100 dark:bg-red-900/30 font-semibold' : ''
                  }`}
                >
                  {format.quality} ({format.format?.toUpperCase()})
                  <span className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">{format.size}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    // Render as buttons if <=4
    return (
      <div className="grid gap-3">
        {currentFormats.map(format => (
          <button
            key={format.itag}
            onClick={() => setSelectedItag(format.itag)}
            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
              selectedItag === format.itag
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-neutral-200 dark:border-neutral-600 hover:border-red-300 dark:hover:border-red-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {format.quality}
                </span>
                <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                  ({format.format?.toUpperCase()})
                </span>
              </div>
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {format.size}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-xl">
      <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8">
        Download Options
      </h3>
      {/* Format Type Selector */}
      <div className="mb-8">
        <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-2xl p-2">
          <button
            onClick={() => onFormatChange('video')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              selectedFormat === 'video'
                ? 'bg-red-600 text-white shadow-lg transform scale-105'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            📹 Video
          </button>
          <button
            onClick={() => onFormatChange('audio')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
              selectedFormat === 'audio'
                ? 'bg-red-600 text-white shadow-lg transform scale-105'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            🎵 Audio Only
          </button>
        </div>
      </div>
      {/* Quality & Format Options */}
      <div className="mb-8">
        <label className="block text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          {selectedFormat === 'video' ? 'Quality & Format (Video or Video+Audio)' : 'Audio Quality & Format'}
        </label>
        {renderFormatOptions()}
      </div>
      {/* Download Button */}
      <button
        onClick={() => onDownload({
          itag: selectedFormatData?.itag,
          format: selectedFormatData?.format || 'mp4'
        })}
        disabled={isDownloading || !selectedItag}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
      >
        {isDownloading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Downloading...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Now ({selectedFormatData?.size || 'N/A'})
          </div>
        )}
      </button>

      {selectedFormat === 'video' && (
        <div className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          High-quality videos are automatically merged with the best available audio.
        </div>
      )}
    </div>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: '🚀',
      title: 'Lightning Fast',
      description: 'Download videos in seconds with our optimized servers'
    },
    {
      icon: '🎯',
      title: 'Multiple Formats',
      description: 'Support for MP4, MP3, WEBM, and more formats'
    },
    {
      icon: '📱',
      title: 'All Devices',
      description: 'Works perfectly on desktop, mobile, and tablet'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your downloads are private and secure'
    },
    {
      icon: '💡',
      title: 'No Ads, No Limits',
      description: 'Unlimited downloads, no interruptions, no distractions'
    },
    {
      icon: '🎨',
      title: 'High Quality',
      description: 'Download up to 4K resolution videos'
    }
  ];

  return (
    <section id="features" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose YT Downloader?
          </h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
            Experience the fastest, most reliable YouTube downloader with cutting-edge features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-neutral-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-neutral-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        {/* Thin line after section */}
        <div className="border-t border-neutral-800 mt-16"></div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      step: '1',
      title: 'Paste URL',
      description: 'Copy and paste your video URL from any supported platform'
    },
    {
      step: '2',
      title: 'Choose Format',
      description: 'Select your preferred quality and format (video or audio)'
    },
    {
      step: '3',
      title: 'Download',
      description: 'Click download and get your file instantly'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="text-xl text-neutral-400">
            Three simple steps to download any video
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                {step.step}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-neutral-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        {/* Thin line after section */}
        <div className="border-t border-neutral-800 mt-16"></div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-neutral-900 dark:bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <YouTubeIcon />
              <span className="text-2xl font-bold">YT Downloader</span>
            </div>
            <p className="text-neutral-400 mb-4">
              The world's fastest and most reliable YouTube downloader.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-neutral-400">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">DMCA</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-800 pt-8 text-center text-neutral-400">
          <p>&copy; 2025 YT Downloader. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
const App = () => {
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('video');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFetch = async () => {
    if (!url) return;
    
    setIsLoading(true);
    try {
      const videoData = await VideoAPI.getVideoInfo(url);
      setVideo(videoData);
    } catch (error) {
      console.error('Failed to fetch video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (options) => {
    setIsDownloading(true);
    try {
      await VideoAPI.downloadVideo(url, options);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleHideVideo = () => {
    setVideo(null);
    setUrl('');
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-black transition-all duration-500">
        <Header />
        <main>
          <HeroSection 
            url={url} 
            setUrl={setUrl} 
            onFetch={handleFetch} 
            isLoading={isLoading} 
          />
          {/* Thin line after HeroSection */}
          <div className="border-t border-neutral-800 max-w-7xl mx-auto" />
          {video && (
            <section className="py-24 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                  <VideoPreviewCard video={video} onHide={handleHideVideo} url={url} />
                  <FormatSelector
                    video={video}
                    selectedFormat={selectedFormat}
                    onFormatChange={setSelectedFormat}
                    onDownload={handleDownload}
                    isDownloading={isDownloading}
                  />
                </div>
                {/* Legal Disclaimer */}
                <div className="mt-16 p-8 bg-neutral-900 border border-neutral-800 rounded-3xl">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">⚖️</div>
                    <div>
                      <h3 className="text-xl font-bold text-red-200 mb-3">
                        Legal Notice & Disclaimer
                      </h3>
                      <p className="text-red-300 leading-relaxed">
                        Please ensure you have the legal right to download and use the content. Respect copyright laws, 
                        content creators' rights, and platform terms of service. This tool is intended for personal use, 
                        educational purposes, and content you own or have permission to download. Users are solely 
                        responsible for compliance with applicable laws and regulations.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Thin line after video section */}
                <div className="border-t border-neutral-800 mt-16"></div>
              </div>
            </section>
          )}
          <FeaturesSection />
          <HowItWorksSection />
        </main>
        <Footer />
      </div>
      {/* Custom Styles for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animation-delay-300 { animation-delay: 300ms; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </ThemeProvider>
  );
};

function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default App;