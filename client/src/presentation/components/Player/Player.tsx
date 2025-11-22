import { useState, useEffect } from 'react';
import { useAudioPlayerContext } from '../../context/AudioPlayerContext';
import { useMusicRepository } from '../../hooks/useMusicRepository';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Repeat1,
    Loader2, Heart, Shuffle, Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const Player = () => {
    const {
        currentTrack, playerState, currentTime, duration, volume,
        repeatMode, isShuffle, pause, resume, seek, setVolume,
        toggleRepeat, toggleShuffle, playNext, playPrev
    } = useAudioPlayerContext();

    const repository = useMusicRepository();
    const [isLiked, setIsLiked] = useState(false);

    // Check initial like status
    useEffect(() => {
        const checkLike = async () => {
            if (currentTrack) {
                const liked = await repository.isLiked(currentTrack.id);
                setIsLiked(liked);
            } else {
                setIsLiked(false);
            }
        };
        checkLike();
    }, [currentTrack, repository]);

    // Listen for external like toggles (e.g. from TrackItem) to update Player heart
    useEffect(() => {
        const handleExternalLike = (e: CustomEvent) => {
            if (currentTrack && e.detail.trackId === currentTrack.id) {
                setIsLiked(e.detail.isLiked);
            }
        };

        window.addEventListener('music:like-toggled', handleExternalLike as EventListener);
        return () => {
            window.removeEventListener('music:like-toggled', handleExternalLike as EventListener);
        };
    }, [currentTrack]);

    const formatTime = (seconds: number): string => {
        if (!Number.isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (playerState === 'playing') pause();
        else resume();
    };

    const handleSeek = (value: number[]) => {
        if (currentTrack) seek(value[0]);
    };

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0]);
    };

    const handleLike = async () => {
        if (currentTrack) {
            try {
                const newState = await repository.toggleLike(currentTrack.id);
                setIsLiked(newState);

                // Dispatch global event so Index.tsx knows to remove from list if needed
                window.dispatchEvent(new CustomEvent('music:like-toggled', {
                    detail: { trackId: currentTrack.id, isLiked: newState }
                }));

                toast({ description: newState ? "Добавлено в любимые" : "Удалено из любимых" });
            } catch (e) {
                toast({ description: "Ошибка обновления лайка", variant: "destructive" });
            }
        }
    };

    const hasTrack = !!currentTrack;
    const isLoading = playerState === 'loading' || playerState === 'buffering';
    const isPlaying = playerState === 'playing';
    const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

    if (!hasTrack && playerState === 'idle') return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="max-w-7xl mx-auto px-4 pb-6">
                <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border border-border rounded-xl shadow-2xl h-[90px] flex flex-col justify-center px-6 pointer-events-auto">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                        {/* Track Info */}
                        <div className="flex items-center gap-3 min-w-0 justify-start">
                            {hasTrack && currentTrack.coverUrl ? (
                                <img
                                    src={currentTrack.coverUrl}
                                    alt={currentTrack.title}
                                    className="w-14 h-14 rounded-md object-cover shadow-sm flex-shrink-0"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-md bg-muted flex flex-shrink-0 items-center justify-center">
                                    <Music className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                            )}

                            <div className="min-w-0 flex flex-col justify-center overflow-hidden">
                                <div className="font-medium text-sm truncate pr-2" title={currentTrack?.title}>
                                    {currentTrack?.title || "No track selected"}
                                </div>
                                <div className="text-xs text-muted-foreground truncate pr-2" title={currentTrack?.artist}>
                                    {currentTrack?.artist || "Choose a track"}
                                </div>
                            </div>

                            {hasTrack && (
                                <Button variant="ghost" size="icon" className={cn("h-8 w-8 flex-shrink-0 ml-1", isLiked ? "text-primary" : "text-muted-foreground")} onClick={handleLike}>
                                    <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                                </Button>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col items-center justify-center w-full max-w-md gap-1">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={toggleShuffle} disabled={!hasTrack}
                                        className={cn("h-8 w-8 transition-colors relative", isShuffle ? "text-primary" : "text-muted-foreground", isShuffle && "after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full")}>
                                    <Shuffle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={playPrev} disabled={!hasTrack} className="h-8 w-8">
                                    <SkipBack className="h-5 w-5 fill-current" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={handlePlayPause} disabled={!hasTrack}
                                        className="h-10 w-10 rounded-full border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-md">
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={playNext} disabled={!hasTrack} className="h-8 w-8">
                                    <SkipForward className="h-5 w-5 fill-current" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={toggleRepeat} disabled={!hasTrack}
                                        className={cn("h-8 w-8 transition-colors relative", repeatMode !== 'off' ? "text-primary" : "text-muted-foreground", repeatMode !== 'off' && "after:absolute after:-bottom-1 after:w-1 after:h-1 after:bg-primary after:rounded-full")}>
                                    <RepeatIcon className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 w-full">
                                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
                                <Slider value={[currentTime]} max={duration || 100} step={1} onValueChange={handleSeek} disabled={!hasTrack} className="w-full cursor-pointer" />
                                <span className="text-xs text-muted-foreground w-10 text-left tabular-nums">{hasTrack ? formatTime(duration) : "0:00"}</span>
                            </div>
                        </div>

                        {/* Volume */}
                        <div className="flex items-center justify-end gap-2 min-w-0">
                            <Volume2 className={cn("h-4 w-4 flex-shrink-0", !hasTrack ? "text-muted-foreground/50" : "text-muted-foreground")} />
                            <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} disabled={!hasTrack} className="w-24 md:w-32" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};