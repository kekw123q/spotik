import { useState, useEffect } from 'react';
import { Track } from '../domain/entities/Track';
import { Playlist } from '../domain/entities/Playlist';
import { useMusicRepository } from '../presentation/hooks/useMusicRepository';
import { useAudioPlayerContext } from '../presentation/context/AudioPlayerContext';
import { SearchBar } from '../presentation/components/Search/SearchBar';
import { TrackList } from '../presentation/components/TrackList/TrackList';
import { PlaylistGrid } from '../presentation/components/Playlists/PlaylistGrid';
import { UploadTrackDialog } from '@/presentation/components/Upload/UploadTrackDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Music, ArrowLeft, Sun, Moon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme-provider';

const Index = () => {
    const repository = useMusicRepository();
    const { play, currentTrack, playerState, pause, resume } = useAudioPlayerContext();
    const { theme, setTheme } = useTheme();

    // Data State
    const [searchTracks, setSearchTracks] = useState<Track[]>([]);
    const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);

    // Navigation State
    const [activeTab, setActiveTab] = useState("search");
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

    // Loading State
    const [isLoadingTracks, setIsLoadingTracks] = useState(false);
    const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setIsLoadingTracks(true);
            setIsLoadingPlaylists(true);

            const [tracksData, userData] = await Promise.all([
                repository.searchTracks(''),
                repository.getUserPlaylists(),
            ]);

            setSearchTracks(tracksData);
            setUserPlaylists(userData);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load music data',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingTracks(false);
            setIsLoadingPlaylists(false);
        }
    };

    const handleSearch = async (query: string) => {
        try {
            setIsLoadingTracks(true);
            setActiveTab("search");
            const results = await repository.searchTracks(query);
            setSearchTracks(results);
        } catch (error) {
            console.error('Search failed:', error);
            toast({
                title: 'Error',
                description: 'Search failed',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingTracks(false);
        }
    };

    const handleTrackSelect = (track: Track, context: Track[]) => {
        if (currentTrack?.id === track.id) {
            if (playerState === 'playing') {
                pause();
            } else {
                resume();
            }
        } else {
            // PASS THE CONTEXT (LIST OF TRACKS) TO THE PLAYER
            play(track, context);
        }
    };

    const handlePlaylistSelect = (playlist: Playlist) => {
        setSelectedPlaylist(playlist);
    };

    const handleBackToPlaylists = () => {
        setSelectedPlaylist(null);
    };

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <div className="min-h-screen bg-background pb-32 transition-colors duration-300">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="grid grid-cols-[240px_1fr_240px] items-center gap-4">
                        <div
                            className="flex items-center justify-center gap-2 cursor-pointer group w-full"
                            onClick={() => setActiveTab("search")}
                        >
                            <h1 className="text-5xl font-jersey text-primary transition-[filter] duration-300 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] hidden md:block leading-none pt-1">
                                SPOTIK
                            </h1>
                        </div>

                        <div className="flex justify-center w-full">
                            <div className="w-full max-w-2xl">
                                <SearchBar onSearch={handleSearch} isLoading={isLoadingTracks} />
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
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
                                    <TabsTrigger
                                        value="search"
                                        className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                                    >
                                        Главная
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="user"
                                        className="w-full justify-start px-4 py-2 h-10 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                                    >
                                        Ваши плейлисты
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
                            <TabsContent value="search" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
                                <div className="mb-4">
                                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Треки</h2>
                                    <p className="text-muted-foreground">Найдите свою любимую музыку</p>
                                </div>

                                {isLoadingTracks ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <TrackList
                                        tracks={searchTracks}
                                        onTrackSelect={(track) => handleTrackSelect(track, searchTracks)}
                                        currentTrackId={currentTrack?.id}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="user" className="mt-0 animate-in fade-in-50 duration-300">
                                {isLoadingPlaylists ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : selectedPlaylist ? (
                                    <div className="space-y-6">
                                        <Button
                                            variant="ghost"
                                            className="gap-2 pl-0 hover:pl-2 transition-all"
                                            onClick={handleBackToPlaylists}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Назад к плейлистам
                                        </Button>

                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            {selectedPlaylist.coverUrl ? (
                                                <img src={selectedPlaylist.coverUrl} alt={selectedPlaylist.name} className="w-48 h-48 rounded-lg shadow-lg object-cover" />
                                            ) : (
                                                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                                                    <Music className="h-16 w-16 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div>
                                                <h2 className="text-3xl font-bold mb-2">{selectedPlaylist.name}</h2>
                                                <p className="text-muted-foreground mb-4">{selectedPlaylist.description}</p>
                                                <p className="text-sm font-medium">{selectedPlaylist.tracks.length} tracks</p>
                                            </div>
                                        </div>

                                        <TrackList
                                            tracks={selectedPlaylist.tracks}
                                            onTrackSelect={(track) => handleTrackSelect(track, selectedPlaylist.tracks)}
                                            currentTrackId={currentTrack?.id}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="mb-4">
                                            <h2 className="text-3xl font-bold mb-2 tracking-tight">Ваши плейлисты</h2>
                                        </div>
                                        <PlaylistGrid
                                            playlists={userPlaylists}
                                            onPlaylistSelect={handlePlaylistSelect}
                                        />
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