import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/domain/entities/Track.ts';
import { useMusicRepository } from './useMusicRepository';

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
    const repository = useMusicRepository();
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

    const stateRef = useRef({
        currentTrack,
        queue,
        originalQueue,
        repeatMode,
        isShuffle
    });

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
            // Do not auto-set to playing if we are just restoring state
            if (audioRef.current?.paused) {
                setPlayerState('paused');
            } else {
                setPlayerState('playing');
            }
        };
        const handleWaiting = () => setPlayerState('buffering');
        const handlePlaying = () => setPlayerState('playing');
        const handlePause = () => setPlayerState('paused');
        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            // Debounce save logic in real app, for now simple trigger
            if (stateRef.current.currentTrack && Math.floor(audio.currentTime) % 5 === 0) {
                repository.saveLastPlayed(stateRef.current.currentTrack.id, audio.currentTime);
            }
        };
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleError = (e: ErrorEvent) => {
            console.error('Audio error event:', e);
            setPlayerState('error');
        };

        const handleEnded = () => {
            const { repeatMode, currentTrack, queue } = stateRef.current;

            if (repeatMode === 'one') {
                audio.currentTime = 0;
                audio.play().catch(console.error);
                return;
            }

            if (currentTrack && queue.length > 0) {
                const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
                const nextIndex = currentIndex + 1;

                if (nextIndex < queue.length) {
                    internalPlay(queue[nextIndex]);
                } else if (repeatMode === 'all') {
                    internalPlay(queue[0]);
                } else {
                    setPlayerState('idle');
                    setCurrentTime(0);
                    repository.saveLastPlayed('-1', 0); // Clear state
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

        // Resume Logic
        const loadLastPlayed = async () => {
            try {
                const lastPlayed = await repository.getLastPlayed();
                if (lastPlayed && lastPlayed.trackId !== '-1') {
                    const track = await repository.getTrack(lastPlayed.trackId);
                    if (track) {
                        setCurrentTrack(track);
                        audio.src = track.audioUrl;
                        audio.currentTime = lastPlayed.position;
                        setCurrentTime(lastPlayed.position);
                        setPlayerState('paused'); // Start paused
                    }
                }
            } catch (e) {
                console.error("Failed to resume playback", e);
            }
        };
        loadLastPlayed();

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

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const internalPlay = (track: Track) => {
        if (!audioRef.current) return;
        setCurrentTrack(track);
        setPlayerState('loading');
        audioRef.current.src = track.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(console.error);
    };

    const play = useCallback((track: Track, context?: Track[]) => {
        if (!audioRef.current) return;

        if (currentTrack?.id === track.id) {
            audioRef.current.play().catch(console.error);
            return;
        }

        if (context && context.length > 0) {
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
        if (currentTrack) {
            repository.saveLastPlayed(currentTrack.id, audioRef.current?.currentTime || 0);
        }
    }, [currentTrack]);

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
        repository.saveLastPlayed('-1', 0);
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
            const { currentTrack, originalQueue } = stateRef.current;

            if (willShuffle) {
                if (currentTrack && originalQueue.length > 0) {
                    const others = originalQueue.filter(t => t.id !== currentTrack.id);
                    const shuffled = fisherYatesShuffle(others);
                    setQueue([currentTrack, ...shuffled]);
                }
            } else {
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
            if (repeatMode === 'all') nextIndex = 0;
            else return;
        }
        internalPlay(queue[nextIndex]);
    }, []);

    const playPrev = useCallback(() => {
        const { queue, currentTrack, repeatMode } = stateRef.current;
        if (!currentTrack || queue.length === 0) return;

        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }

        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        let prevIndex = currentIndex - 1;

        if (prevIndex < 0) {
            if (repeatMode === 'all') prevIndex = queue.length - 1;
            else prevIndex = 0;
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