import { useCallback, useEffect, useRef, useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from '@/components/ui/button';

interface CustomPlayerProps {
    videoId: string;
    audioUrl: string;
}

declare global {
    interface Window {
        YT: typeof YT;
        onYouTubeIframeAPIReady: () => void;
    }
}

const CustomPlayer = ({ videoId, audioUrl }: CustomPlayerProps) => {
    const videoPlayerRef = useRef<YT.Player | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);

    // Initialize YouTube API
    useEffect(() => {
        const loadYouTubeAPI = () => {
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                document.body.appendChild(tag);
            }
        };
        loadYouTubeAPI();
    }, []);

    // Initialize YouTube Player
    useEffect(() => {
        const createPlayer = () => {
            if (window.YT && window.YT.Player) {
                videoPlayerRef.current = new YT.Player('youtube-player', {
                    videoId: videoId,
                    playerVars: {
                        mute: 1, // Start muted
                        controls: 0, // Hide default controls
                    },
                    events: {
                        onReady: () => {
                            setIsVideoReady(true);
                            if (videoPlayerRef.current) {
                                setDuration(videoPlayerRef.current.getDuration());
                            }
                        },
                        onStateChange: (event) => {
                            setIsPlaying(event.data === YT.PlayerState.PLAYING);
                        },
                    },
                });
            }
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            window.onYouTubeIframeAPIReady = createPlayer;
        }

        return () => {
            if (videoPlayerRef.current) {
                videoPlayerRef.current.destroy();
            }
        };
    }, [videoId]);

    // Initialize Audio
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.load();

            audioRef.current.addEventListener('loadedmetadata', () => {
                setIsAudioReady(true);
            });

            audioRef.current.addEventListener('timeupdate', () => {
                if (audioRef.current) {
                    const newProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                    setProgress(newProgress);
                    setCurrentTime(audioRef.current.currentTime);
                }
            });
        }
    }, [audioUrl]);

    const getCurrentTime = useCallback(() => {
        return audioRef.current?.currentTime || 0;
    }, []);

    const seekTo = useCallback((time: number) => {
        if (videoPlayerRef.current && audioRef.current) {
            videoPlayerRef.current.seekTo(time, true);
            audioRef.current.currentTime = time;
            setCurrentTime(time);
            setProgress((time / duration) * 100);
        }
    }, [duration]);

    const togglePlayPause = useCallback(() => {
        if (!isVideoReady || !isAudioReady) return;

        if (videoPlayerRef.current && audioRef.current) {
            if (isPlaying) {
                videoPlayerRef.current.pauseVideo();
                audioRef.current.pause();
            } else {
                videoPlayerRef.current.playVideo();
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying, isVideoReady, isAudioReady]);

    const handleSkipTime = useCallback((time: number) => {
        const currentTime = getCurrentTime();
        const newTime = time > 0
            ? Math.min(currentTime + time, duration)
            : Math.max(currentTime + time, 0);

        if (isFinite(newTime) && newTime >= 0 && newTime <= duration) {
            seekTo(newTime);
        }
    }, [getCurrentTime, duration, seekTo]);

    const handleSeek = useCallback((value: number[]) => {
        const newTime = (value[0] / 100) * duration;
        seekTo(newTime);
    }, [duration, seekTo]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (event.key) {
                case ' ':
                    event.preventDefault();
                    togglePlayPause();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    handleSkipTime(5);
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    handleSkipTime(-5);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [togglePlayPause, handleSkipTime]);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="aspect-w-16 aspect-h-9 mb-4">
                <div id="youtube-player" className="w-full h-full"></div>
                <audio ref={audioRef} className="hidden" />
            </div>

            <div className="space-y-4 px-4">
                <div className="flex items-center space-x-4">
                    <Button
                        onClick={togglePlayPause}
                        disabled={!isVideoReady || !isAudioReady}
                        className="w-12 h-12"
                    >
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        )}
                    </Button>

                    <div className="flex-1">
                        <Slider
                            min={0}
                            max={100}
                            step={0.1}
                            value={[progress]}
                            onValueChange={handleSeek}
                            className="cursor-pointer"
                        />
                    </div>

                    <div className="text-sm font-mono">
                        {Math.floor(currentTime)}/{Math.floor(duration)}s
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomPlayer;