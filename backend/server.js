const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000;app.use(cors());app.use(cors());app.use(cors());

// Middleware
app.use(cors());
app.use(express.json());

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Get video info endpoint
app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;

        // Helper to remove duplicate itags
        function uniqueByItag(formats) {
            const seen = new Set();
            return formats.filter(f => {
                if (seen.has(f.itag)) return false;
                seen.add(f.itag);
                return true;
            });
        }

        // Get available formats
        // 1. All video formats (video+audio and video-only)
        const videoFormats = uniqueByItag(info.formats.filter(f => f.hasVideo));

        // 2. For audio, prefer m4a but include all unique audio-only formats
        let audioFormats = uniqueByItag(info.formats.filter(f => f.hasAudio && !f.hasVideo));

        // Try to find all unique m4a audio-only formats
        const m4aAudioFormats = uniqueByItag(
            info.formats.filter(f => f.hasAudio && !f.hasVideo && f.container === 'm4a')
        );

        // If m4a formats exist, use only those; otherwise, use all audio-only formats
        if (m4aAudioFormats.length > 0) {
            audioFormats = m4aAudioFormats;
        }

        // Process video formats (include hasAudio so frontend can label "No Audio")
        const processedVideoFormats = videoFormats.map(format => ({
            itag: format.itag,
            quality: format.qualityLabel || format.quality,
            format: format.container,
            size: format.contentLength ? `${Math.round(format.contentLength / 1024 / 1024)}MB` : 'Unknown',
            hasAudio: format.hasAudio,
            hasVideo: format.hasVideo
        }));

        // Process audio formats
        const processedAudioFormats = audioFormats.map(format => ({
            itag: format.itag,
            quality: format.audioBitrate ? `${format.audioBitrate}kbps` : 'Unknown',
            format: format.container === 'mp4' && format.mimeType && format.mimeType.includes('m4a') ? 'm4a' : format.container,
            size: format.contentLength ? `${Math.round(format.contentLength / 1024 / 1024)}MB` : 'Unknown'
        }));

        const response = {
            title: videoDetails.title,
            description: videoDetails.description?.substring(0, 300) + '...' || 'No description available',
            thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
            duration: formatDuration(videoDetails.lengthSeconds),
            views: formatViews(videoDetails.viewCount),
            channel: videoDetails.author.name,
            uploadDate: videoDetails.publishDate || 'Unknown',
            formats: {
                video: processedVideoFormats, // All video formats (video+audio and video-only)
                audio: processedAudioFormats  // Prefer m4a, else all audio-only
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({ error: 'Failed to fetch video information' });
    }
});

// Download video endpoint
app.post('/api/download', async (req, res) => {
    try {
        const { url, itag } = req.body;

        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const format = info.formats.find(f => f.itag == itag);

        if (!format) {
            return res.status(400).json({ error: 'Format not found' });
        }

        const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${title}.mp4`;

        // If the selected format has both video and audio, stream directly
        if (format.hasAudio && format.hasVideo) {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format.mimeType || 'application/octet-stream');
            return ytdl(url, { format }).pipe(res);
        }

        // If video-only, merge with best audio using ffmpeg
        if (format.hasVideo && !format.hasAudio) {
            console.log('Merging video-only and audio-only streams with ffmpeg...');

            const audioFormat = info.formats
                .filter(f => f.hasAudio && !f.hasVideo && f.container === 'm4a')
                .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0]
                || info.formats.filter(f => f.hasAudio && !f.hasVideo)[0];

            if (!audioFormat) {
                return res.status(400).json({ error: 'No audio stream found to merge.' });
            }

            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'video/mp4');

            console.log('Merging video-only and audio-only streams with ffmpeg...');

            const ffmpeg = spawn('ffmpeg', [
                '-loglevel', 'error',
                '-i', 'pipe:3', // video
                '-i', 'pipe:4', // audio
                '-map', '0:v',
                '-map', '1:a',
                '-c', 'copy',
                '-f', 'mp4',
                '-movflags', 'frag_keyframe+empty_moov',
                'pipe:5'
            ], {
                stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe']
            });

            ytdl(url, { format }).pipe(ffmpeg.stdio[3]);
            ytdl(url, { format: audioFormat }).pipe(ffmpeg.stdio[4]);
            ffmpeg.stdio[5].pipe(res);

            ffmpeg.on('error', (err) => {
                console.error('ffmpeg error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Merging failed' });
                }
            });

            ffmpeg.on('close', (code) => {
                if (code !== 0) {
                    console.error(`ffmpeg exited with code ${code}`);
                }
            });

            return;
        }

        // If audio-only, stream directly with correct extension and content-type
        if (format.hasAudio && !format.hasVideo) {
            const audioExt = format.container || 'm4a';
            res.setHeader('Content-Disposition', `attachment; filename="${title}.${audioExt}"`);
            res.setHeader('Content-Type', format.mimeType || `audio/${audioExt}`);
            return ytdl(url, { format }).pipe(res);
        }

        // Fallback
        return res.status(400).json({ error: 'Unsupported format selection.' });

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
});

// Helper functions
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(viewCount) {
    if (viewCount >= 1000000) {
        return `${(viewCount / 1000000).toFixed(1)}M views`;
    } else if (viewCount >= 1000) {
        return `${(viewCount / 1000).toFixed(1)}K views`;
    }
    return `${viewCount} views`;
}
// app.use(cors({ origin: 'https://your-frontend-domain.com' }));
app.use(cors());
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Downloads will be saved to: ${downloadsDir}`);
});