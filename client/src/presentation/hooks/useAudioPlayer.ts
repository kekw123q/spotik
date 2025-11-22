import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/domain/entities/Track.ts';

export type PlayerState = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'error';
export type RepeatMode = 'off' | 'all' | 'one';

interface UseAudioPlayerReturn {
    currentTrack: Track | null;
    playerState: PlayerState;
    currentTime: number;
    duration: number;
    volume: number;
    repeatMode: RepeatMode;
    isShuffle: boolean;
    play: (track: Track, context?: Track[]) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleRepeat: () => void;
    toggleShuffle: () => void;
    playNext: () => void;
    playPrev: () => void;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // State
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [playerState, setPlayerState] = useState<PlayerState>('idle');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.5);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
    const [isShuffle, setIsShuffle] = useState(false);

    // Queues
    const [queue, setQueue] = useState<Track[]>([]);
    const [originalQueue, setOriginalQueue] = useState<Track[]>([]);

    // Refs for event listeners to access latest state without re-binding
    const stateRef = useRef({
        currentTrack,
        queue,
        originalQueue,
        repeatMode,
        isShuffle
    });

    // Sync refs with state
    useEffect(() => {
        stateRef.current = { currentTrack, queue, originalQueue, repeatMode, isShuffle };
    }, [currentTrack, queue, originalQueue, repeatMode, isShuffle]);

    // Initialize Audio
    useEffect(() => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = volume;
        audioRef.current = audio;

        const handleLoadStart = () => setPlayerState('loading');
        const handleCanPlay = () => {
            setPlayerState((prev) => prev === 'paused' ? 'paused' : 'playing');
            if (audio.paused && audioRef.current?.src) {
                audio.play().catch(e => console.error("Auto-play blocked:", e));
            }
        };
        const handleWaiting = () => setPlayerState('buffering');
        const handlePlaying = () => setPlayerState('playing');
        const handlePause = () => setPlayerState('paused');
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleError = (e: ErrorEvent) => {
            console.error('Audio error event:', e);
            setPlayerState('error');
        };

        // Logic for Auto-Advance
        const handleEnded = () => {
            const { repeatMode, currentTrack, queue } = stateRef.current;

            if (repeatMode === 'one') {
                audio.currentTime = 0;
                audio.play().catch(console.error);
                return;
            }

            // Logic for 'off' and 'all' (playlist repeat)
            if (currentTrack && queue.length > 0) {
                const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
                const nextIndex = currentIndex + 1;

                if (nextIndex < queue.length) {
                    // Play next track
                    internalPlay(queue[nextIndex]);
                } else if (repeatMode === 'all') {
                    // Loop back to start
                    internalPlay(queue[0]);
                } else {
                    // Stop
                    setPlayerState('idle');
                    setCurrentTime(0);
                }
            } else {
                setPlayerState('idle');
                setCurrentTime(0);
            }
        };

        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError as any);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError as any);
            audioRef.current = null;
        };
    }, []);

    // Volume Sync
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Helper to trigger playback without resetting queue logic from outside
    const internalPlay = (track: Track) => {
        if (!audioRef.current) return;
        setCurrentTrack(track);
        setPlayerState('loading');
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
    };

    // --- Public Methods ---

    const play = useCallback((track: Track, context?: Track[]) => {
        if (!audioRef.current) return;

        // If playing the same track, just resume
        if (currentTrack?.id === track.id) {
            audioRef.current.play().catch(console.error);
            return;
        }

        // Update queue if context provided
        if (context && context.length > 0) {
            // If shuffle is already on, we need to shuffle the new context
            // but keep the selected track first
            if (stateRef.current.isShuffle) {
                const otherTracks = context.filter(t => t.id !== track.id);
                const shuffled = fisherYatesShuffle(otherTracks);
                setQueue([track, ...shuffled]);
            } else {
                setQueue(context);
            }
            setOriginalQueue(context);
        }

        internalPlay(track);
    }, [currentTrack]);

    const pause = useCallback(() => {
        audioRef.current?.pause();
    }, []);

    const resume = useCallback(() => {
        audioRef.current?.play().catch(console.error);
    }, []);

    const stop = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTrack(null);
        setPlayerState('idle');
        setCurrentTime(0);
    }, []);

    const seek = useCallback((time: number) => {
        if (audioRef.current) audioRef.current.currentTime = time;
    }, []);

    const setVolume = useCallback((val: number) => {
        setVolumeState(Math.max(0, Math.min(1, val)));
    }, []);

    const toggleRepeat = useCallback(() => {
        setRepeatMode(prev => {
            if (prev === 'off') return 'all';
            if (prev === 'all') return 'one';
            return 'off';
        });
    }, []);

    const fisherYatesShuffle = (array: Track[]) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    const toggleShuffle = useCallback(() => {
        setIsShuffle(prev => {
            const willShuffle = !prev;
            const { currentTrack, originalQueue, queue } = stateRef.current;

            if (willShuffle) {
                // Turn ON: Shuffle current queue, keeping current track first
                if (currentTrack && originalQueue.length > 0) {
                    const others = originalQueue.filter(t => t.id !== currentTrack.id);
                    const shuffled = fisherYatesShuffle(others);
                    setQueue([currentTrack, ...shuffled]);
                }
            } else {
                // Turn OFF: Restore original order
                setQueue(originalQueue);
            }
            return willShuffle;
        });
    }, []);

    const playNext = useCallback(() => {
        const { queue, currentTrack, repeatMode } = stateRef.current;
        if (!currentTrack || queue.length === 0) return;

        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        let nextIndex = currentIndex + 1;

        if (nextIndex >= queue.length) {
            if (repeatMode === 'all') nextIndex = 0; // Loop to start
            else return; // End of playlist
        }

        internalPlay(queue[nextIndex]);
    }, []);

    const playPrev = useCallback(() => {
        const { queue, currentTrack, repeatMode } = stateRef.current;
        if (!currentTrack || queue.length === 0) return;

        // If more than 3 seconds in, restart track
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        let prevIndex = currentIndex - 1;

        if (prevIndex < 0) {
            if (repeatMode === 'all') prevIndex = queue.length - 1; // Loop to end
            else prevIndex = 0; // Stay at start
        }

        internalPlay(queue[prevIndex]);
    }, []);

    return {
        currentTrack,
        playerState,
        currentTime,
        duration,
        volume,
        repeatMode,
        isShuffle,
        play,
        pause,
        resume,
        stop,
        seek,
        setVolume,
        toggleRepeat,
        toggleShuffle,
        playNext,
        playPrev
    };
};