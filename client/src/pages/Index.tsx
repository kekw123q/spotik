import { useState, useEffect } from 'react';
import { Track } from '../domain/entities/Track';
import { Playlist } from '../domain/entities/Playlist';
import { useMusicRepository } from '../presentation/hooks/useMusicRepository';
import { useAudioPlayerContext } from '../presentation/context/AudioPlayerContext';
import { SearchBar } from '../presentation/components/Search/SearchBar';
import { TrackList } from '../presentation/components/TrackList/TrackList';
import { PlaylistGrid } from '../presentation/components/Playlists/PlaylistGrid';
import { UploadTrackDialog } from '@/presentation/components/Upload/UploadTrackDialog';
import { CreatePlaylistDialog } from '@/presentation/components/Playlists/CreatePlaylistDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, Moon, Music, Heart, Plus, ChevronRight, Play, Pause } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme-provider';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
    const repository = useMusicRepository();
    const { play, currentTrack, playerState, pause, resume, isShuffle } = useAudioPlayerContext();
    const { theme, setTheme } = useTheme();

    const [searchTracks, setSearchTracks] = useState<Track[]>([]);
    const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
    const [activeTab, setActiveTab] = useState("search");
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

    // NEW: Store IDs of liked tracks to sync UI
    const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

    const [isLoadingTracks, setIsLoadingTracks] = useState(false);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'user') {
            refreshPlaylists();
        }
    }, [activeTab]);

    // --- Event Listener for Player <-> List synchronization ---
    useEffect(() => {
        const handleLikeToggleEvent = (e: CustomEvent) => {
            const { trackId, isLiked } = e.detail;

            // 1. Update global set of liked IDs
            setLikedTrackIds(prev => {
                const next = new Set(prev);
                if (isLiked) next.add(trackId);
                else next.delete(trackId);
                return next;
            });

            // 2. If we are viewing "Liked Songs", remove the track if isLiked becomes false
            if (selectedPlaylist?.id === 'liked-songs' && !isLiked) {
                setSelectedPlaylist(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        tracks: prev.tracks.filter(t => t.id !== trackId)
                    };
                });
                refreshPlaylists();
            }
        };

        window.addEventListener('music:like-toggled', handleLikeToggleEvent as EventListener);
        return () => {
            window.removeEventListener('music:like-toggled', handleLikeToggleEvent as EventListener);
        };
    }, [selectedPlaylist]);

    const loadInitialData = async () => {
        try {
            setIsLoadingTracks(true);
            setIsLoadingPlaylists(true);
            const [tracksData, userData, likedTracks] = await Promise.all([
                repository.searchTracks(''),
                repository.getUserPlaylists(),
                repository.getLikedTracks() // Fetch likes to sync UI on load
            ]);
            setSearchTracks(tracksData);
            setUserPlaylists(userData);
            setLikedTrackIds(new Set(likedTracks.map(t => t.id)));
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoadingTracks(false);
            setIsLoadingPlaylists(false);
        }
    };

    const refreshPlaylists = async () => {
        setIsLoadingPlaylists(true);
        try {
            const pls = await repository.getUserPlaylists();
            setUserPlaylists(pls);
        } finally {
            setIsLoadingPlaylists(false);
        }
    };

    const handleSearch = async (query: string) => {
        try {
            setIsLoadingTracks(true);
            if(activeTab !== 'search') setActiveTab("search");
            const results = await repository.searchTracks(query);
            setSearchTracks(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoadingTracks(false);
        }
    };

    const handleTrackSelect = (track: Track, context: Track[]) => {
        if (currentTrack?.id === track.id) {
            if (playerState === 'playing') pause();
            else resume();
        } else {
            play(track, context);
        }
    };

    const handlePlaylistSelect = (playlist: Playlist) => {
        setSelectedPlaylist(playlist);
    };

    const handleBackToPlaylists = () => {
        setSelectedPlaylist(null);
        refreshPlaylists();
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    // --- Handle Like Toggle from List Row ---
    const handleLikeToggle = async (track: Track) => {
        try {
            const newState = await repository.toggleLike(track.id);

            // Dispatch event to notify Player and Index (ourselves)
            window.dispatchEvent(new CustomEvent('music:like-toggled', {
                detail: { trackId: track.id, isLiked: newState }
            }));

            if (activeTab === 'user') {
                refreshPlaylists();
            }

            toast({ description: newState ? "Добавлено в любимые" : "Удалено из любимых" });
        } catch (e) {
            toast({ description: "Ошибка", variant: "destructive" });
        }
    };

    const handlePlayLiked = (e: React.MouseEvent, likedPlaylist: Playlist) => {
        e.stopPropagation();
        if (!likedPlaylist.tracks.length) return;

        const isPlayingFromLiked = currentTrack && likedPlaylist.tracks.some(t => t.id === currentTrack.id);

        if (isPlayingFromLiked) {
            if (playerState === 'playing') pause();
            else resume();
            return;
        }

        let startTrack = likedPlaylist.tracks[0];
        if (isShuffle) {
            const randomIndex = Math.floor(Math.random() * likedPlaylist.tracks.length);
            startTrack = likedPlaylist.tracks[randomIndex];
        }

        play(startTrack, likedPlaylist.tracks);
    };

    const likedPlaylist = userPlaylists.find(p => p.id === 'liked-songs');
    const customPlaylists = userPlaylists.filter(p => p.id !== 'liked-songs');
    const likedPreviewTracks = likedPlaylist ? likedPlaylist.tracks.slice(0, 5) : [];
    const isPlayingLiked = currentTrack && likedPlaylist?.tracks.some(t => t.id === currentTrack.id) && playerState === 'playing';

    return (
        <div className="min-h-screen bg-background pb-32 transition-colors duration-300">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="grid grid-cols-[240px_1fr_240px] items-center gap-4">
                        <div
                            className="flex items-center justify-center gap-2 cursor-pointer group w-full"
                            onClick={() => setActiveTab("search")}
                        >
                            <h1 className="text-5xl font-jersey text-primary hidden md:block leading-none pt-1">
                                SPOTIK
                            </h1>
                        </div>

                        <div className="flex justify-center w-full">
                            <SearchBar onSearch={handleSearch} isLoading={isLoadingTracks} />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={toggleTheme}>
                                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col md:flex-row gap-8">
                        <aside className="md:w-60 flex-shrink-0 space-y-6">
                            <div className="bg-card rounded-lg border border-border p-2 shadow-sm">
                                <TabsList className="flex flex-col h-auto w-full gap-1 bg-transparent p-0">
                                    <TabsTrigger value="search" className="w-full justify-start px-4 py-2 h-10">
                                        Главная
                                    </TabsTrigger>
                                    <TabsTrigger value="user" className="w-full justify-start px-4 py-2 h-10">
                                        Коллекция
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                                <h3 className="text-sm font-medium text-muted-foreground mb-4 px-2">Library</h3>
                                <div className="space-y-2">
                                    <UploadTrackDialog />
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 min-w-0 bg-card rounded-xl border border-border p-6 shadow-sm min-h-[600px]">
                            <TabsContent value="search" className="mt-0 space-y-6">
                                <div className="mb-4">
                                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Треки</h2>
                                    <p className="text-muted-foreground">Найдите свою любимую музыку</p>
                                </div>
                                <TrackList
                                    tracks={searchTracks}
                                    onTrackSelect={(track) => handleTrackSelect(track, searchTracks)}
                                    currentTrackId={currentTrack?.id}
                                    isLoading={isLoadingTracks}
                                    onToggleLike={handleLikeToggle}
                                    likedTrackIds={likedTrackIds} // Pass the set of liked IDs
                                />
                            </TabsContent>

                            <TabsContent value="user" className="mt-0">
                                {selectedPlaylist ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all" onClick={handleBackToPlaylists}>
                                            <ArrowLeft className="h-4 w-4" />
                                            Назад к коллекции
                                        </Button>

                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            {selectedPlaylist.id === 'liked-songs' ? (
                                                <div className="w-48 h-48 rounded-lg shadow-lg flex items-center justify-center bg-gradient-to-br from-purple-600 to-red-600">
                                                    <Heart className="h-20 w-20 text-white fill-white" />
                                                </div>
                                            ) : selectedPlaylist.coverUrl ? (
                                                <img src={selectedPlaylist.coverUrl} alt={selectedPlaylist.name} className="w-48 h-48 rounded-lg shadow-lg object-cover" />
                                            ) : (
                                                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                                                    <Music className="h-16 w-16 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1 uppercase tracking-wider font-medium">
                                                    Плейлист
                                                </div>
                                                <h2 className="text-4xl font-bold mb-3">{selectedPlaylist.name}</h2>
                                                <p className="text-muted-foreground mb-4 text-lg">{selectedPlaylist.description}</p>
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <span>{selectedPlaylist.tracks.length} треков</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <TrackList
                                                tracks={selectedPlaylist.tracks}
                                                onTrackSelect={(track) => handleTrackSelect(track, selectedPlaylist.tracks)}
                                                currentTrackId={currentTrack?.id}
                                                onToggleLike={handleLikeToggle}
                                                likedTrackIds={likedTrackIds} // Pass here too
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        <div>
                                            <h2 className="text-3xl font-bold mb-6">Коллекция</h2>
                                            {likedPlaylist && (
                                                <div
                                                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-900/80 to-red-900/80 hover:to-red-900/90 border border-white/10 p-6 cursor-pointer transition-all hover:shadow-lg"
                                                    onClick={() => handlePlaylistSelect(likedPlaylist)}
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex flex-col justify-between h-full min-h-[120px]">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                                                        <Heart className="h-5 w-5 text-white fill-white" />
                                                                    </div>
                                                                    <h3 className="text-3xl font-bold text-white tracking-tight">Мне нравится</h3>
                                                                </div>
                                                                <p className="text-white/70 font-medium ml-1">{likedPlaylist.tracks.length} треков</p>
                                                            </div>

                                                            <div className="mt-4">
                                                                <Button
                                                                    size="icon"
                                                                    className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
                                                                    onClick={(e) => handlePlayLiked(e, likedPlaylist)}
                                                                >
                                                                    {isPlayingLiked ? (
                                                                        <Pause className="h-5 w-5 fill-black" />
                                                                    ) : (
                                                                        <Play className="h-5 w-5 fill-black ml-1" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center relative mr-4 self-center">
                                                            {likedPreviewTracks.map((track, idx) => (
                                                                <div
                                                                    key={track.id}
                                                                    className="h-16 w-16 rounded-full border-2 border-background overflow-hidden -ml-6 first:ml-0 shadow-lg transition-transform group-hover:translate-x-2"
                                                                    style={{ zIndex: 5 - idx }}
                                                                >
                                                                    {track.coverUrl ? (
                                                                        <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="h-full w-full bg-muted flex items-center justify-center">
                                                                            <Music className="h-6 w-6 text-muted-foreground" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            {likedPlaylist.tracks.length > 5 && (
                                                                <div className="h-16 w-16 rounded-full border-2 border-background bg-black/40 backdrop-blur-md flex items-center justify-center -ml-6 z-0">
                                                                    <span className="text-white font-medium text-sm">+{likedPlaylist.tracks.length - 5}</span>
                                                                </div>
                                                            )}
                                                            <ChevronRight className="h-8 w-8 text-white/40 ml-4 group-hover:translate-x-2 transition-transform" />
                                                        </div>
                                                    </div>

                                                    <Heart className="absolute -bottom-12 -right-12 h-64 w-64 text-white/5 rotate-12 pointer-events-none" />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <h2 className="text-2xl font-bold">Мои плейлисты</h2>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                <CreatePlaylistDialog onCreated={refreshPlaylists}>
                                                    <Card className="cursor-pointer hover:bg-accent/50 transition-all border-dashed flex flex-col items-center justify-center aspect-square group bg-transparent">
                                                        <CardContent className="flex flex-col items-center justify-center p-6 text-center h-full w-full">
                                                            <div className="h-14 w-14 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-3 transition-colors">
                                                                <Plus className="h-7 w-7 text-primary" />
                                                            </div>
                                                            <span className="font-medium group-hover:text-primary transition-colors">Создать плейлист</span>
                                                        </CardContent>
                                                    </Card>
                                                </CreatePlaylistDialog>

                                                <PlaylistGrid
                                                    playlists={customPlaylists}
                                                    onPlaylistSelect={handlePlaylistSelect}
                                                    isLoading={isLoadingPlaylists}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </main>
        </div>
    );
};

export default Index;