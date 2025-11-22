import { useAudioPlayerContext } from '../../context/AudioPlayerContext';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Repeat,
    Repeat1,
    Loader2,
    Heart,
    Shuffle,
    Music
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const Player = () => {
    const {
        currentTrack,
        playerState,
        currentTime,
        duration,
        volume,
        repeatMode,
        isShuffle,
        pause,
        resume,
        seek,
        setVolume,
        toggleRepeat,
        toggleShuffle,
        playNext,
        playPrev
    } = useAudioPlayerContext();

    const formatTime = (seconds: number): string => {
        if (!Number.isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (playerState === 'playing') {
            pause();
        } else {
            resume();
        }
    };

    const handleSeek = (value: number[]) => {
        if (currentTrack) seek(value[0]);
    };

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0]);
    };

    const handleLike = () => {
        if (currentTrack) {
            toast({ description: "Added to Liked Songs" });
        }
    };

    const hasTrack = !!currentTrack;
    const isLoading = playerState === 'loading' || playerState === 'buffering';
    const isPlaying = playerState === 'playing';

    // Determine repeat icon
    const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="max-w-7xl mx-auto px-4 pb-6">
                <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border border-border rounded-xl shadow-2xl h-[90px] flex flex-col justify-center px-6 pointer-events-auto">

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

                        {/* 1. Track Info */}
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
                                <div
                                    className={cn(
                                        "font-medium text-sm truncate pr-2",
                                        !hasTrack && "text-muted-foreground"
                                    )}
                                    title={hasTrack ? currentTrack.title : ""}
                                >
                                    {hasTrack ? currentTrack.title : "No track selected"}
                                </div>
                                <div
                                    className="text-xs text-muted-foreground truncate pr-2"
                                    title={hasTrack ? currentTrack.artist : ""}
                                >
                                    {hasTrack ? currentTrack.artist : "Choose a track to play"}
                                </div>
                            </div>

                            {hasTrack && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0 ml-1" onClick={handleLike}>
                                    <Heart className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* 2. Controls & Progress */}
                        <div className="flex flex-col items-center justify-center w-full max-w-md gap-1">

                            <div className="flex items-center gap-4">
                                {/* Shuffle Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleShuffle}
                                    disabled={!hasTrack}
                                    className={cn(
                                        "h-8 w-8 hover:text-foreground transition-colors relative",
                                        isShuffle ? "text-primary" : "text-muted-foreground",
                                        isShuffle && "after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                                    )}
                                >
                                    <Shuffle className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={playPrev}
                                    disabled={!hasTrack}
                                    className="h-8 w-8 text-foreground"
                                >
                                    <SkipBack className="h-5 w-5 fill-current" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePlayPause}
                                    disabled={!hasTrack}
                                    className="h-10 w-10 rounded-full border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-md"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : isPlaying ? (
                                        <Pause className="h-5 w-5 fill-current" />
                                    ) : (
                                        <Play className="h-5 w-5 fill-current ml-0.5" />
                                    )}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={playNext}
                                    disabled={!hasTrack}
                                    className="h-8 w-8 text-foreground"
                                >
                                    <SkipForward className="h-5 w-5 fill-current" />
                                </Button>

                                {/* Repeat Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleRepeat}
                                    disabled={!hasTrack}
                                    className={cn(
                                        "h-8 w-8 hover:text-foreground transition-colors relative",
                                        repeatMode !== 'off' ? "text-primary" : "text-muted-foreground",
                                        repeatMode !== 'off' && "after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                                    )}
                                >
                                    <RepeatIcon className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 w-full">
                                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                                    {formatTime(currentTime)}
                                </span>
                                <Slider
                                    value={[currentTime]}
                                    max={duration || 100}
                                    step={1}
                                    onValueChange={handleSeek}
                                    disabled={!hasTrack}
                                    className="w-full cursor-pointer"
                                />
                                <span className="text-xs text-muted-foreground w-10 text-left tabular-nums">
                                    {hasTrack ? formatTime(duration) : "0:00"}
                                </span>
                            </div>
                        </div>

                        {/* 3. Volume */}
                        <div className="flex items-center justify-end gap-2 min-w-0">
                            <Volume2 className={cn("h-4 w-4 flex-shrink-0", !hasTrack ? "text-muted-foreground/50" : "text-muted-foreground")} />
                            <Slider
                                value={[volume]}
                                max={1}
                                step={0.01}
                                onValueChange={handleVolumeChange}
                                disabled={!hasTrack}
                                className="w-24 md:w-32"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};