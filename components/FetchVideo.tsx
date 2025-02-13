'use client'
import { useState } from 'react';
import { Button } from './ui/button';
import CustomPlayer from './CustomPlayer';

const FetchVideo = () => {

    const [videoId, setVideoId] = useState<string | null>(null);
    const [mediaType, setMediaPlayerType] = useState<string | null>(null);
    const [url, setUrl] = useState<string>('');

    const extractVideoId = (input: string): string | null => {
        // Check if input starts with 'https'
        if (!input.endsWith('.mp3') && (input.startsWith('https://') || input.startsWith('http://'))) {
            // Use regex to extract video ID from URL
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const match = input.match(regex);
            return match ? match[1] : null;
        } else if (input.length === 11) {
            // If it's exactly 11 characters, it's likely a YouTube video ID
            return input;

        }
        else if (input.endsWith('.mp3')) {
            setMediaPlayerType('audio');
            return input;
        }
        else if (mediaType === 'audio')
            return input;
        // If neither condition is satisfied, return null
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // resetNotes(); // reset the global state of notes to [] for new video load
        const extractedVideoId = extractVideoId(url);
        if (extractedVideoId?.startsWith('blob:') || extractedVideoId?.endsWith('.mp3') || extractedVideoId?.length === 11) {
            if (extractedVideoId.endsWith('.mp3') || extractedVideoId.startsWith('blob:'))
                setMediaPlayerType('audio');
            else {
                setMediaPlayerType('youtube');
            }
            setVideoId(extractedVideoId); // set the video id locally in this component
        } else {
            alert('Invalid YouTube URL');
        }
    };

    return (
        <div className="flex flex-col items-center h-full p-4">
            <h1 className="text-2xl font-bold">Media Annotator</h1>
            <form onSubmit={handleSubmit} className="mb-4 flex justify-center gap-2 w-full">
                <input
                    type="text"
                    disabled={!!videoId}
                    value={url ?? ''}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter YouTube video URL"
                    className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-xl"
                />
                <Button
                    type="submit"
                    disabled={!!videoId}
                    className={`bg-blue-500 text-white px-4 py-2 rounded-md w-max`}

                >
                    Fetch Video
                </Button>
            </form>

            {/* Re-render CustomYouTubePlayer when videoId changes */}
            {videoId && <CustomPlayer
                videoId={videoId}
                audioUrl="/audio/a1.mp3"
            />}
        </div >
    );
};

export default FetchVideo;
